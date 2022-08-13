import { useEffect } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

function parseClientTokenResponse(hash) {
    let elements = hash.replace('#', '').split('&');
    let response = {};
    elements.forEach(elem => {
        let parts = elem.split('=');
        response[parts[0]] = parts[1];
    });
    return response;
}

function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const location = useLocation();
    const response = parseClientTokenResponse(location.hash);
    useEffect(() => {
        if (response['access_token']) {
            auth.login(response);
            navigate("/", { replace: true });
        }
    });
    return (
        <Container>
            <Spinner animation="border"></Spinner>
        </Container>
    );
}

export default Login;