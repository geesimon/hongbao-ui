import { ethers } from 'ethers';
import ETHHongbaoContract from '../src/contracts/ETHHongbao.json';
import CampaignManagerContract from '../src/contracts/CampaignManager.json';
import CampaignContract from '../src/contracts/Campaign.json';
import AllConfig from './config.json';
import * as utils from './utils.js';

const bigInt = require('big-integer');

const REFUND = '0';
const TREE_LEVELS = 20;

const env = utils.getCookie("env");
const config = AllConfig[env ? env : "main"];

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

const ETHHongbaoAbi = ETHHongbaoContract.abi;
const CampaignAbi = CampaignContract.abi;

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

  return new ethers.Contract(
                              config.CAMPAIGN_MANAGER_CONTRACT_ADDRESS, 
                              CampaignManagerAbi, 
                              provider
                            );
}

const getETHHongbao = async (_address) => {
  const provider = await getSigner();

  return new ethers.Contract(_address, ETHHongbaoAbi, provider);
}

const getCampaign = async (_address) => {
  const provider = await getSigner();

  return new ethers.Contract(_address, CampaignAbi, provider);
}

export const getFee = (_amount) => ethers.utils.parseEther(config.ETH_HONGBAO_CONTRACTS[_amount].FEE);

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
  const campaignManager = new ethers.Contract(
                                              config.CAMPAIGN_MANAGER_CONTRACT_ADDRESS, 
                                              CampaignManagerAbi, 
                                              provider
                                            );

  const res =  await campaignManager.getCampaignInfo(_id);
  const balance = await provider.getBalance(res.campaignContract);
  return {
          id: Number(_id), 
          contract:res.campaignContract, 
          name: res.name, 
          description:res.description,
          balance: ethers.utils.formatEther((Number(balance)).toString())
        };
}

export const makeDeposit = async(_commitment, _amount, _setProgress) => {
    _setProgress({status: 'Making deposit', variant: 'info', percentage: 5})
    const ETHHongbao = await getETHHongbao(config.ETH_HONGBAO_CONTRACTS[_amount].ADDRESS);
    const sendValue = ethers.utils.parseEther((_amount).toString()).toString();
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

const postToRelayer = async (_proofData, _publicSignals, _hongbaoAddress) => {
  const reqJSON = JSON.stringify({
                                  proofData: _proofData,
                                  publicSignals: _publicSignals,
                                  hongbaoAddress: _hongbaoAddress
                                });
  const rawResponse = await window.fetch(config.RELAYER_URL, {
                                      method: 'POST',
                                      headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json'
                                      },
                                      body: reqJSON});

  const response = await rawResponse.json();

  // console.log("Relayer response:", response);

  return response;
}

export const makeTransfer = async(
                                    _depositNote, 
                                    _depositTxArgs,
                                    _hongbaoContract,
                                    _recipientAddress,
                                    _setProgress,
                                    _fee
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
    relayer: bigInt(config.RELAYER_ADDRESS.slice(2), 16).toString(),
    fee: _fee.toString(),
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

  // const tx = await _hongbaoContract.withdraw(proofData, publicSignals);
  // _setProgress({status: 'Waiting Confirmation...', variant: 'info', percentage: 90})
  // const receipt = await tx.wait();
  // console.log(receipt);

  const hongbaoAddress = _hongbaoContract.address;
  const response = await postToRelayer(proofData, publicSignals, hongbaoAddress);
  if (response.code !== 0) {
    _setProgress({status: response.error, variant: 'danger', percentage: 100})
  } else {
    _setProgress({status: 'Done!', variant: 'info', percentage: 100})
  }
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