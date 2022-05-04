import * as React from 'react';
import {Card, Button, ListGroup, ListGroupItem} from 'react-bootstrap';
import Layout from '../components/layout';

const CampaignPage = () => {
  return (
    <Layout pageTitle="Campaign Info">
      <Card>
        <Card.Body>
          <Card.Title>Campaign Title</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">Already Got: $1,000</Card.Subtitle>
          <Card.Text>
            Some quick example text to build on the card title and make up the bulk of
            the card's content.
          </Card.Text>
          <Button variant="primary">Give</Button>
        </Card.Body>
      </Card>
    </Layout>
  )
}

export default CampaignPage