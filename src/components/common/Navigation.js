import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { authService } from "../../lib/services";
import { useAuth } from "../auth/AuthContext";
import { icons } from "./Icons";
import logo from '../../logo.svg'

function Navigation() {
    const auth = useAuth();
    const location = useLocation();
    const setHrefAndActive = href => {
        return {
            as: Link,
            to: href,
            active: location.pathname === href
        }
    };
    const text = auth.isLoggedIn() ? 'Dashboard' : 'Home';
    const accountTitle = (
        <span>{icons.icon('person-circle')} Account</span>
    );
    return (
        <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top">
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
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link {...setHrefAndActive(auth.isLoggedIn() ? '/dashboard' : '/')} >{text}</Nav.Link>
                    </Nav>
                    {auth.isLoggedIn() &&
                        <Nav>
                            <NavDropdown active={location.pathname.match(/^\/account/)} title={accountTitle}>
                                <NavDropdown.Item {...setHrefAndActive('/account/groups')}>Groups</NavDropdown.Item>
                                <NavDropdown.Item {...setHrefAndActive('/account/cameras')}>Cameras</NavDropdown.Item>
                                <NavDropdown.Item {...setHrefAndActive('/account/videos')}>Motion Videos</NavDropdown.Item>
                                <NavDropdown.Item {...setHrefAndActive('/account/subscriptions')}>Subscriptions</NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Link href={authService.logoutEndpoint(window.location.origin)}>{icons.icon('box-arrow-right')} <small>Log Out</small></Nav.Link>
                        </Nav>
                    }
                </Navbar.Collapse>
            </Container>
        </Navbar>
    ); 
}

export default Navigation;