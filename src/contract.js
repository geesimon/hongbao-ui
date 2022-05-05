import { ethers } from 'ethers';
import CampaignManagerContract from './contracts/CampaignManager.json';
const CampaignManagerAbi = CampaignManagerContract.abi;
const CampaignManagerAddress = "0x695B4367D9096D287960718Bf509bB53be6e3B56";


// const CampaignManagerAbi = [
//   "function createCampaign (string _name, string  _description) returns (address)",
//   "function getMyCampaignIDs() external view returns (uint256[])",
// ];

const getProvider = () => {
  const {ethereum} = window;
  
  if(!ethereum) {
    alert("Please make sure you have Metamask compatible wallet installed!");
    return;
  }
  return new ethers.providers.Web3Provider(window.ethereum);
}

export const getSigner = async () => {
  const web3Provider = getProvider();
    
  try{
    await web3Provider.send("eth_requestAccounts", []);
    const signer = web3Provider.getSigner();
      
    return signer;
  } catch (err) {
    console.log(err)
      return null;
  }
}

export const createCampaign = async (_signer, _name, _description) => {
  const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
  // await web3Provider.send("eth_requestAccounts", []);
  const signer = web3Provider.getSigner();

  const campaignManagerContract = new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, signer);
  // const campaignManagerSigner = campaignManagerContract.connect(signer);
  
  return await campaignManagerContract.createCampaign(_name, _description);
}

export const getMyCampaignIDs = (_signer) => {
  const web3Provider = getProvider();
  const campaignManagerContract = new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, web3Provider);
  const campaignManagerSigner = campaignManagerContract.connect(_signer);
  // return campaignManagerContract.getMyCampaignIDs();
  return campaignManagerSigner.getMyCampaignIDs();
}

export const getCampaignInfo = (id) => {
  const web3Provider = getProvider();
  const campaignManagerContract = new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, web3Provider);
  return campaignManagerContract.getCampaignInfo(id);
}

