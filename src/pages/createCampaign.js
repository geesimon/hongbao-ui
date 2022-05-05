import * as React from 'react';
import {Button, Form, FormControl} from 'react-bootstrap';
import Layout from '../components/layout';
import {getSigner, createCampaign, getMyCampaignIDs, getCampaignInfo} from '../contract'

const CreateCampaignPage = () => {
  const handleClick = () => {
    // const signer = getSigner();

    // if (!signer) {
    //   console.log("Can not get signer!!!");
    //   return;
    // }
    // const ids = await getMyCampaignIDs(signer);
    // console.log(ids);
    const tx = createCampaign("hello", "me");
    console.log(tx);

    const info = getCampaignInfo(0);
    console.log(info);
  }

  return (
    <Layout pageTitle="Create New Campaign">
      <Form>
        <Form.Group className="mb-3" controlId="formGroupTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="input" placeholder="" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formGroupDescription">
          <Form.Label>Description</Form.Label>
          <FormControl as="textarea" aria-label="With textarea" />
          <Form.Text muted>
              Please provide description for this campaign.
          </Form.Text>
        </Form.Group>        
      </Form>
      <div className="d-grid gap-2">
        <Button variant="primary" size="lg" onClick={handleClick}>
          Create
        </Button>
      </div>
    </Layout>
  )
}

export default CreateCampaignPage