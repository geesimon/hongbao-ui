import { ethers } from 'ethers';
import ETHHongbaoContract from '../src/contracts/ETHHongbao.json';
import CampaignManagerContract from '../src/contracts/CampaignManager.json';
import CampaignContract from '../src/contracts/Campaign.json';
import * as utils from './utils.js';

const bigInt = require('big-integer');

const FEE = '0';
const REFUND = '0';
const TREE_LEVELS = 20;
const BALANCE_MULTIPLIER = 1;

// const CampaignManagerAddress = "0xFaA61fF00986079Ce84189F35b1677610A2eCd98"; //Dev
// const CampaignManagerAddress = "0x68ca3828C0268Cd9A6048E7F3DB4fDfcf971C38d" //Harmony Test
const CampaignManagerAddress = "0x46ae45448ddEd730d1AcA074f806109245a08502"; //Harmony Mainnet

const CampaignManagerAbi = CampaignManagerContract.abi;
// const CampaignManagerAbi = [
//           "constructor(address[])", 
//           "function campaignIDs(address,uint256) view returns (uint256)", 
//           "function currentCampaignIndex() view returns (uint256)", 
//           "function hongbaos(uint256) view returns (address)", 
//           "function createCampaign(string,string) returns (address)", 
//           "function getMyCampaignIDs() view returns (uint256[])", 
//           "function getCampaignInfo(uint256) view returns (tuple(address,string,string))"
// ];

// const ETHHongbaoAddresses = { 
//   //Harmony Test
//   1 : "0xC8B9DFe300F374491a25597043252F1343b250f0", 
//   10 : "0x5B26C997f65e5E4ec93CB05A9a795F9DE2D4150e",
//   100 : "0x5b630F70943199EaD899D61BdfaC42D5DC699c95",
//   1000 : "0x1B3Ed84f469c65B35E38e6Ff64584dE9a92d4f13"
// };
const ETHHongbaoAddresses = { 
  //Harmony Mainnet
  1 : "0x85f179b1763AE933d6B95A8B473889e9d290A784", 
  10 : "0x674f5440Aea3679A5567dFE3c621131Da427605B",
  100 : "0x79670b9EBCcb8c562F0e42c46EE8086726F9B93D",
  1000 : "0x56A67a9933EC75d47E29c7D1D6C8d155A54ccf43"
};

const ETHHongbaoAbi = ETHHongbaoContract.abi;

const CampaignAbi = CampaignContract.abi;

const RELAYER = '0x851C97eAba917b43CBa3724D6D810DbdfE416463';

export const abiJson2Human = () => {
  let iface = new ethers.utils.Interface(CampaignManagerAbi);
  console.log(iface.format(ethers.utils.FormatTypes.full));

  iface = new ethers.utils.Interface(ETHHongbaoAbi);
  console.log(iface.format(ethers.utils.FormatTypes.full));  

  iface = new ethers.utils.Interface(CampaignAbi);
  console.log(iface.format(ethers.utils.FormatTypes.full));  
}

const getProvider = () => {
  const {ethereum} = window;
  
  if(!ethereum) {
    alert("Please make sure you have Metamask compatible wallet installed!");
    return;
  }
  return new ethers.providers.Web3Provider(window.ethereum);
}

const getSigner = async () => {
  const web3Provider = getProvider();
    
  try{
    await web3Provider.send("eth_requestAccounts", []);
    return web3Provider.getSigner();
  } catch (err) {
    console.log(err)
    return null;
  }
}

const getCampaignManager = async (_useSigner) => {
  const provider = _useSigner ? await getSigner() : getProvider();

  return new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, provider);
}

const getETHHongbao = async (_address) => {
  const provider = await getSigner();

  return new ethers.Contract(_address, ETHHongbaoAbi, provider);
}

const getCampaign = async (_address) => {
  const provider = await getSigner();

  return new ethers.Contract(_address, CampaignAbi, provider);
}

export const createCampaign = async (_name, _description) => {
  const campaignManager = await getCampaignManager(true);
  
  return campaignManager.createCampaign(_name, _description);
}

export const getMyCampaignIDs = async () => {
  const campaignManager = await getCampaignManager(true);
  
  return campaignManager.getMyCampaignIDs();
}

export const getCampaignInfo = async (_id) => {
  const provider = getProvider();
  const campaignManager = new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, provider);

  const res =  await campaignManager.getCampaignInfo(_id);
  const balance = await provider.getBalance(res.campaignContract);
  return {
          id: Number(_id), 
          contract:res.campaignContract, 
          name: res.name, 
          description:res.description,
          balance: ethers.utils.formatEther((Number(balance) * BALANCE_MULTIPLIER).toString())
        };
}

export const makeDeposit = async(_commitment, _amount, _setProgress) => {
    _setProgress({status: 'Making deposit', variant: 'info', percentage: 5})
    const ETHHongbao = await getETHHongbao(ETHHongbaoAddresses[_amount]);
    const sendValue = ethers.utils.parseEther((_amount / BALANCE_MULTIPLIER).toString()).toString();
    _setProgress({status: 'Making Deposit...', variant: 'info', percentage: 5})
    const tx = await ETHHongbao.deposit(utils.toFixedHex(_commitment), 
                                              { value: sendValue });
    _setProgress({status: 'Waiting Confirmation...', variant: 'info', percentage: 20})
    const {events} = await tx.wait();
    console.log(events[0].args);
    
    return {
      HongbaoContract: ETHHongbao,
      txArgs: events[0].args
    }
}

export const makeTransfer = async(
                                    _depositNote, 
                                    _depositTxArgs,
                                    _hongbaoContract,
                                    _recipientAddress,
                                    _setProgress
                                    ) => {
  _setProgress({status: 'Generating ZK Proof...', variant: 'info', percentage: 40})

  const { root, pathElements, pathIndices } = _depositTxArgs;
  let nullifierHash = await utils.pedersenHasher(utils.bigInt2BytesLE(_depositNote.nullifier, 31));

  const input = {
    root: root,
    nullifier: _depositNote.nullifier.toString(),
    nullifierHash: nullifierHash.toString(),
    secret: _depositNote.secret.toString(),
    pathElements: pathElements,
    pathIndices: utils.bits2PathIndices(pathIndices, TREE_LEVELS),
    recipient: _recipientAddress,
    relayer: bigInt(RELAYER.slice(2), 16).toString(),
    fee: FEE.toString(),
    refund: REFUND.toString(),
  };

  console.log(input);

  const {proof, publicSignals} = await window.snarkjs.groth16.fullProve(
                                            input,
                                            '../withdraw.wasm',
                                            '../circuit_withdraw_final.zkey'
                                          );
  _setProgress({status: 'Verifying ZK Proof...', variant: 'info', percentage: 50})
  const vkey = await window.fetch("../withdraw_verification_key.json")
                .then( function(res) {
                  return res.json();
                });
  const res = await window.snarkjs.groth16.verify(vkey, publicSignals, proof);
  if (!res){
    _setProgress({status: "ZK Proof Verify Failed!", variant: 'danger', percentage: 50});
    return;
  }

  _setProgress({status: 'Transfering Fund...', variant: 'info', percentage: 60})
  
  const proofData = utils.packProofData(proof);

  const tx = await _hongbaoContract.withdraw(proofData, publicSignals);
  _setProgress({status: 'Waiting Confirmation...', variant: 'info', percentage: 90})
  const receipt = await tx.wait();
  console.log(receipt);

  _setProgress({status: 'Done!', variant: 'info', percentage: 100})
} 

export const makeWithdrawal = async (_campaignContractAddress, _setProgress) => {
  _setProgress({status: "...", variant: 'info', percentage: 10});
  const campaign = await getCampaign(_campaignContractAddress);
  _setProgress({status: "...", variant: 'info', percentage: 20});

  const currentUserAddress = await campaign.signer.getAddress();
  _setProgress({status: "...", variant: 'info', percentage: 30});

  const owner = await campaign.owner();
  _setProgress({status: "...", variant: 'info', percentage: 40});

  if (currentUserAddress === owner) {
    const tx = await campaign.withdraw();
    const receipt = await tx.wait();
    console.log(receipt);

    _setProgress({status: "Done!", variant: 'info', percentage: 100});
  } else {
    _setProgress({status: 'Only Campaign Owner Can Withdraw!', variant: 'danger', percentage: 100});
  }
}