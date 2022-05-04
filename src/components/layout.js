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
            {children}
            <Footer />            
        </main>
    )
}

export default Layout