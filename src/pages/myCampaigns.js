import * as React from 'react';
import {Table, Button} from 'react-bootstrap';
import Layout from '../components/Layout';
import {getMyCampaignIDs, getCampaignInfo} from '/static/contract'

const MyCampaigns = () => {
  const [campaigns, setCampaigns] = React.useState([]);

  React.useEffect(() => {
    getMyCampaignIDs().then(ids => {
      const allInfo = ids.map(id => getCampaignInfo(id));      
      Promise.all(allInfo).then(values => setCampaigns(values))
    })
  }, []);
  
  return (
    <Layout pageTitle="My Campaigns">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Id</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {
            campaigns.map(c => {
              return (
                <tr key = {c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.balance}</td>
                  <td><Button href={"../campaign?id="+c.id}>Details</Button></td>
                </tr>
              )
            })
          }
        </tbody>
      </Table>
    </Layout>
  )
}

export default MyCampaigns