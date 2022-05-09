import { ethers } from 'ethers';
import ETHHongbaoContract from './ETHHongbao.json';
import CampaignManagerContract from './CampaignManager.json';
import CampaignContract from './Campaign.json';
import * as utils from './utils.js';

const bigInt = require('big-integer');

const FEE = '0';
const REFUND = '0';
const TREE_LEVELS = 20;


const CampaignManagerAbi = CampaignManagerContract.abi;
const CampaignManagerAddress = "0x333e769EF1772AE3678c63E8f4879e65935C1280"; //Dev
// const CampaignManagerAddress = "0xb4b99e1a14281233AE57BC39c97D9e0585676249" //Harmony Test
// const CampaignManagerAddress = "0x333e769EF1772AE3678c63E8f4879e65935C1280"; //Harmony Production

const ETHHongbaoAbi = ETHHongbaoContract.abi;
const ETHHongbaoAddresses = { 
  //Dev
  1 : "0x87c4a39A42F37e5Ff389BE1D66B751bDF96E30de", 
  10 : "0x796a5cFa94514a2Ab712d92155a143910AdE6B83",
  100 : "0xE132BE9A86ed2225694e52612DeFE8B8e908b74f",
  1000 : "0x036eFb372AE6e7E2b33A48239be2bD1b5c4bF20D"
};

const CampaignAbi = CampaignContract.abi;

const RELAYER = '0x851C97eAba917b43CBa3724D6D810DbdfE416463';

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
          balance: ethers.utils.formatEther(balance)
        };
}

export const makeDeposit = async(_commitment, _amount, _setProgress) => {
    _setProgress({status: 'Making deposit', variant: 'info', percentage: 5})
    const ETHHongbao = await getETHHongbao(ETHHongbaoAddresses[_amount]);
    const sendValue = ethers.utils.parseEther((_amount / 10).toString()).toString();
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