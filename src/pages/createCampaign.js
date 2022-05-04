import * as React from 'react';
import {Button, Form, FormControl} from 'react-bootstrap';
import Layout from '../components/layout';

const CreateCampaignPage = () => {
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
        <Button variant="primary" size="lg">
          Create
        </Button>
      </div>
    </Layout>
  )
}

export default CreateCampaignPage