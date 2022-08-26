import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function CancelButton(props) {
    const navigate = useNavigate();

    const cancelAndReturn = () => {
        navigate(-1);
    };

    return (
        <Button variant="outline-secondary" {...props} onClick={cancelAndReturn}>Cancel</Button>
    );
}

export default CancelButton;