import { ethers } from 'ethers';
import CampaignManagerContract from './CampaignManager.json';
import ETHHongbaoContract from './ETHHongbao.json';
import * as utils from './utils.js';

const bigInt = require('big-integer');

const FEE = '0';
const REFUND = '0';
const TREE_LEVELS = 20;


const CampaignManagerAbi = CampaignManagerContract.abi;
// const CampaignManagerAddress = "0x695B4367D9096D287960718Bf509bB53be6e3B56"; 
const CampaignManagerAddress = "0x333e769EF1772AE3678c63E8f4879e65935C1280"; //Dev
// const CampaignManagerAddress = "0xb4b99e1a14281233AE57BC39c97D9e0585676249" //Harmony Test

const ETHHongbaoAbi = ETHHongbaoContract.abi;
const ETHHongbaoAddresses = {
  1 : "0x87c4a39A42F37e5Ff389BE1D66B751bDF96E30de", //Dev
  10 : "0x796a5cFa94514a2Ab712d92155a143910AdE6B83",
  100 : "0xE132BE9A86ed2225694e52612DeFE8B8e908b74f",
  1000 : "0x036eFb372AE6e7E2b33A48239be2bD1b5c4bF20D"
};

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

export const makeDeposit = async(_commitment, _amount) => {
    console.log("Preparing deposit...")
    const ETHHongbao = await getETHHongbao(ETHHongbaoAddresses[_amount]);
    const sendValue = ethers.utils.parseEther((_amount / 10).toString()).toString();
    console.log("Making deposit...")
    const tx = await ETHHongbao.deposit(utils.toFixedHex(_commitment), 
                                              { value: sendValue });
    const {events} = await tx.wait();
    console.log(events[0].args);
    
    return {
      HongbaoContract: ETHHongbao,
      txArgs: events[0].args
    }
}

export const makeWithdrawal = async(_depositNote, 
                                    _depositTxArgs,
                                    _hongbaoContract,
                                    _recipientAddress) => {
  console.log("Generating Proof");

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
  console.log("Verifying proof")
  const vkey = await window.fetch("../withdraw_verification_key.json")
                .then( function(res) {
                  return res.json();
                });
  const res = await window.snarkjs.groth16.verify(vkey, publicSignals, proof);
  console.log(res);
  
  console.log("Withdrawing...");
  
  const proofData = utils.packProofData(proof);

  const tx = await _hongbaoContract.withdraw(proofData, publicSignals);
  const receipt = await tx.wait();

  console.log(receipt)
} 
