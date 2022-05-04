import * as React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {Button, Row, Col} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ pageTitle, children }) => {
    return (
        <main className="container">
            <title>{pageTitle}</title>
            <Header />
            <Row className="mx-0">
                <Button as={Col} variant="primary">Connect Wallet</Button>
                <Button as={Col} variant="secondary" className="mx-2">Create New Campaign</Button>
                <Button as={Col} variant="success">Button #3</Button>
            </Row>
            {children}
            <Footer />            
        </main>
    )
}

export default Layout