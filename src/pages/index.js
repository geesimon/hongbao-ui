import * as React from 'react';
import Layout from '../components/Layout';
import {Button} from 'react-bootstrap';
import {setCookie} from '/static/utils';
import AllConfig from '/static/config.json';

const ENV = "env";

const IndexPage = () => {
  //Make use of url query "env=<main, dev, test>" to speficy a configuration settings
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has(ENV) && AllConfig.hasOwnProperty(urlParams.get(ENV))){    
    setCookie(ENV, urlParams.get(ENV), 7);
  }

  return (
    <Layout pageTitle="Home Page">
      <h1>Welcome to Hongbao!</h1>
      <p>Hongbao is a Web3 ZKP application that anyone can setup a donation campaign while keeping the donors’ activities completely anonymous.</p>
      <div className="d-grid gap-2">
        <Button variant="primary" size="lg" href="createCampaign">
        Create New Campaign
        </Button>
        <Button variant="secondary" size="lg" href="myCampaigns">
        Check My Current Campaigns
        </Button>
      </div>
    </Layout>
  )
}

export default IndexPage