import * as React from 'react';
import Layout from '../components/Layout';
import {Button} from 'react-bootstrap';

const IndexPage = () => {
  return (
    <Layout pageTitle="Home Page">
      <h1>Welcome to Hongbao!</h1>
      <p>Hongbao is a Web3 ZKP application that anyone can setup a donation campaign while keeping the donors’ activities completely anonymous.</p>
      <div className="d-grid gap-2">
        <Button variant="primary" size="lg" href="createCampaign">
        Create New Campaign
        </Button>
        <Button variant="secondary" size="lg" href="myCampaigns">
        Check My Current Campaign
        </Button>
      </div>
    </Layout>
  )
}

export default IndexPage