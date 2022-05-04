import React from 'react';
import { Navbar, Nav, NavDropdown, Container} from 'react-bootstrap';
import logo from '../images/hongbao.jpeg'

export default function Header() {
    return (
        <Navbar bg="light" expand="lg">
        <Container>
            <Navbar.Brand href="#home">
            <img
                src= {logo}
                width = "30"
                height = "30"
                className = "d-inline-block align-top"
                alt= "HongBao logo"
                />
                HongBao
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link href="#link">Create New</Nav.Link>
            </Nav>
            <Nav>
                <NavDropdown title="More..." id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">New Campaign</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">History</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                </NavDropdown>
            </Nav>
            </Navbar.Collapse>
        </Container>
        </Navbar>
    )
}