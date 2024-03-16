import { Container, Nav, Navbar, NavDropdown, Offcanvas } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { authService } from "../../lib/services";
import { useAuth } from "../auth/AuthContext";
import { icons } from "./Icons";
import logo from '../../logo.svg'
import { useState } from "react";

function Navigation() {
    const [ expanded, setExpanded ] = useState(false);
    const auth = useAuth();
    const location = useLocation();
    const setHrefAndActive = href => {
        return {
            as: Link,
            to: href,
            active: location.pathname === href,
            onClick: event => {
                setExpanded(false);
            }
        }
    };
    const text = auth.isLoggedIn() ? 'Dashboard' : 'Home';
    const accountTitle = (
        <span>{icons.icon('person-circle')} Account</span>
    );
    return (
        <Navbar onToggle={setExpanded} expanded={expanded} expand="lg" bg="dark" variant="dark" sticky="top">
            <Container fluid>
                <Navbar.Brand as={Link} to="/">
                    <img
                        src={logo}
                        width="40"
                        height="40"
                        className="d-inline-block align-top"
                        alt="Pi In The Sky"
                    />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
                <Navbar.Offcanvas className="bg-dark" id="responsive-navbar-nav" placement="end">
                    <Offcanvas.Header closeButton closeVariant="white">
                        <Offcanvas.Title>
                            <img
                                src={logo}
                                width="40"
                                height="40"
                                className="d-inline-block align-top"
                                alt="Pi In The Sky"
                            />
                        </Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="text-white">
                        <Nav className="me-auto">
                            <Nav.Link {...setHrefAndActive(auth.isLoggedIn() ? '/dashboard' : '/')} >{text}</Nav.Link>
                        </Nav>
                        {auth.isLoggedIn() &&
                            <Nav>
                                <NavDropdown active={location.pathname.match(/^\/account/)} title={accountTitle}>
                                    <NavDropdown.Item {...setHrefAndActive('/account')}>Manage Account</NavDropdown.Item>
                                    <NavDropdown.Divider/>
                                    <NavDropdown.Item {...setHrefAndActive('/account/groups')}>Groups</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/cameras')}>Cameras</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/jobs')}>Jobs</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/videos')}>Motion Videos</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/tags')}>Tags</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/stats')}>Health Metrics</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/versions')}>Software Versions</NavDropdown.Item>
                                    <NavDropdown.Item {...setHrefAndActive('/account/subscriptions')}>Subscriptions</NavDropdown.Item>
                                </NavDropdown>
                                <Nav.Link href={authService.logoutEndpoint(window.location.origin)}>{icons.icon('box-arrow-left')} <small>Log Out</small></Nav.Link>
                            </Nav>
                        }
                        {!auth.isLoggedIn() &&
                            <Nav>
                                <Nav.Link href={authService.loginEndpoint(window.location.origin)}>{icons.icon('box-arrow-right')} <small>Login</small></Nav.Link>
                            </Nav>
                        }
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>
    ); 
}

export default Navigation;