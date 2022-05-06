import * as React from 'react';
import {Button, Form, FormControl} from 'react-bootstrap';
import Layout from '../components/Layout';
import {createCampaign} from '../contract'
import { navigate } from 'gatsby';

const CreateCampaignPage = () => {
  const [campaignInfo, setCampaignInfo] = React.useState({
                                          name: "",
                                          description: ""
                                          });

  const handleClick = async () => {
    try{
      if (campaignInfo.name.length === 0 || campaignInfo.description.length === 0) {
        alert("Title or description cannot be empty");
      } else {
        await createCampaign(campaignInfo.name, campaignInfo.description);
        navigate("/myCampaigns");
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleChange = (event) => {
    setCampaignInfo(prev => {
      return {
        ...prev,
        [event.target.name]: event.target.value  
      }
    });
  }

  return (
    <Layout pageTitle="Create New Campaign">
      <Form>
        <Form.Group className="mb-3" controlId="formGroupTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="input" name="name"
            placeholder="Please give the campaign a title" 
            onChange={handleChange}/>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formGroupDescription">
          <Form.Label>Description</Form.Label>
          <FormControl as="textarea" aria-label="With textarea" name="description"
            placeholder="Please provide description for this campaign." 
            onChange={handleChange}>
          </FormControl>
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