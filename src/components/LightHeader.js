import React from 'react';
import { Navbar, Container} from 'react-bootstrap';
import logo from '../images/hongbao.jpeg'

export default function LightHeader() {
    return (
        <Navbar bg="light" expand="lg">
        <Container>
            <Navbar.Brand href="/">
            <img
                src= {logo}
                width = "30"
                height = "30"
                className = "d-inline-block align-top"
                alt= "HongBao logo"
                />
                HongBao
            </Navbar.Brand>
        </Container>
        </Navbar>
    )
}