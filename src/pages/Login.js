import { useEffect } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";
import { parseSearchParams } from "../lib/format";

function parseClientTokenResponse(hash) {
    return parseSearchParams(hash.replace('#', ''));
}

function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const location = useLocation();
    const response = parseClientTokenResponse(location.hash);
    useEffect(() => {
        if (response['access_token']) {
            auth.login(response).finally(() => {
                navigate(response['state'] || "/", { replace: true });
            });
        }
    });
    return (
        <Container>
            <Spinner animation="border"></Spinner>
        </Container>
    );
}

export default Login;