import * as React from 'react';
import LightHeader from './LightHeader';
import Footer from './Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ pageTitle, children }) => {
    return (
        <main className="container">
            <title>{pageTitle}</title>
            <LightHeader />
            {children}
            <Footer />            
        </main>
    )
}

export default Layout