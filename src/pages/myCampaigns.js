import * as React from 'react';
import {Table} from 'react-bootstrap';
import Layout from '../components/layout';

const MyCampaigns = () => {
  return (
    <Layout pageTitle="My Campaigns">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Mark</td>
            <td>$100</td>
            <td>Withdraw</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jacob</td>
            <td>$200</td>
            <td>Withdraw</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Larry the Bird</td>
            <td>$3,000</td>
            <td>Withdraw</td>
          </tr>
        </tbody>
      </Table>
    </Layout>
  )
}

export default MyCampaigns