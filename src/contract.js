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

const getCampaignManager = async (useSigner) => {
  const provider = useSigner ? await getSigner() : getProvider();

  return new ethers.Contract(CampaignManagerAddress, CampaignManagerAbi, provider);
}

export const createCampaign = async (_name, _description) => {
  const campaignManager = await getCampaignManager(true);
  
  return campaignManager.createCampaign(_name, _description);
}

export const getMyCampaignIDs = async () => {
  const campaignManager = await getCampaignManager(true);
  
  return campaignManager.getMyCampaignIDs();
}

export const getCampaignInfo = async (id) => {
  const campaignManager = await getCampaignManager(false);

  const res =  await campaignManager.getCampaignInfo(id);
  return {contract:res.campaignContract, name: res.name, description:res.description};
}

