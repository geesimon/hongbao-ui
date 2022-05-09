import * as React from 'react';
import {Card, Button, Form, Row, Col} from 'react-bootstrap';
import Layout from '../components/Layout';
import { getCampaignInfo, makeDeposit, makeWithdrawal } from '/static/contract';
import {generateDeposit} from '/static/utils'

const CampaignPage = () => {
  const [campaign, setCampaign] = React.useState({
                                    name:'',
                                    description: '',
                                    balance: 0,
                                    amount: 0
                                  });

  React.useEffect(() => {
    // Add snarkjs script
    const script = document.createElement('script');
    script.src = "/snarkjs.min.js";
    document.body.appendChild(script);

    const id = Number(new URLSearchParams(window.location.search).get('id'));    
    getCampaignInfo(id).then(info => setCampaign(prev =>{
        return {
          ...info,
          amount : 0
        }
    }))

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handleGiveClick = async () => {
    // console.log(mimcHasher(1, 2));
    // mimcHasher(1, 2).then(n => console.log(n));
    // pedersenHasher(Buffer(32).fill(1)).then(n => console.log(n));
    const depositNote = await generateDeposit();
    console.log(depositNote);

    const txArgs = await makeDeposit(depositNote.commitment, campaign.amount);
    await makeWithdrawal(depositNote, txArgs);

  }

  const handleChangeAmount = (event) =>{
    setCampaign(prev => {
      return {
        ...prev,
        amount: Number(event.target.value)
      }
    })
  }

  return (
    <Layout pageTitle="Campaign Info">
      <Card >
        <Card.Body>
          <Card.Title>{campaign.name}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">Already Got: {campaign.balance} </Card.Subtitle>
          <Card.Text>
            {campaign.description}
          </Card.Text>          
          <Form >
            <Form.Group as={Row} className="mb-3">
              <Form.Label as="legend" column sm={2}>
                Amount
              </Form.Label>
              <Col sm={10}>
                <Form.Check
                  type="radio"
                  label="1 (ONE)"
                  name="amount_group"
                  id = "amount_1"
                  value = "1"
                  onChange = {handleChangeAmount}
                />
                <Form.Check
                  type="radio"
                  label="10 (ONEs)"
                  name="amount_group"
                  id="amount_2"
                  value = "10"
                  onChange = {handleChangeAmount}
                />
                <Form.Check
                  type="radio"
                  label="100 (ONEs)"
                  name="amount_group"
                  id="amount_3"
                  value = "100"
                  onChange = {handleChangeAmount}
                />
                <Form.Check
                  type="radio"
                  label="1000 (ONEs)"
                  name="amount_group"
                  id="amount_4"
                  value = "1000"
                  onChange = {handleChangeAmount}
                />
              </Col>
            </Form.Group>
            {(campaign.amount !== 0) && <Button variant="primary" onClick={handleGiveClick}>Give</Button>}
            </Form>          
        </Card.Body>
      </Card>
    </Layout>
  )
}

export default CampaignPage