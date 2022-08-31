import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";
import { icons } from "../components/common/Icons";
import { authService } from "../lib/services";


function Home() {
    const auth = useAuth();
    const link = auth.isLoggedIn() ? (
        <Button to="/dashboard" as={Link} variant="success">Get Started</Button>
    ) : (
        <Button href={authService.loginEndpoint(window.location.origin)} variant="primary">Login</Button>
    );
    return (
        <>
            <div className="p-5 mb-4 bg-light rounded-3">
                <Container>
                    <h1 className="display=3">Pi In The Sky</h1>
                    <p>Eyes in <i>your</i> cloud. Storage for video in <i>your</i> control.</p>
                    <p>{link}</p>
                </Container>
            </div>
           <Container>
                <Row>
                    <Col md>
                        <h2><span style={{verticalAlign: 'text-bottom'}}>{icons.icon('camera', 32)}</span> Monitor</h2>
                        <p>See what your cameras see, with a click of a button.</p>
                    </Col>
                    <Col md>
                        <h2>{icons.icon('gear', 32)} Manage</h2>
                        <p>Push configurations remotely. Keep recordings around for as long as you need.</p>
                    </Col>
                    <Col md>
                        <h2>{icons.icon('bell', 32)} Alerts</h2>
                        <p>Be alerted whenever there is movement.</p>
                    </Col>
                </Row>
            </Container> 
        </>
    );
}

export default Home;