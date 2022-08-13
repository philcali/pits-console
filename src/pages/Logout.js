import { useEffect } from "react";
import { Container, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

function Logout() {
    const navigate = useNavigate();
    const auth = useAuth();
    useEffect(() => {
        auth.logout();
        navigate('/', { replace: true });
    });
    return (
        <Container>
            <Spinner animation="border"></Spinner>
        </Container>
    )
}

export default Logout;