import { useEffect } from "react";
import { Alert, Container } from "react-bootstrap";
import { icons } from "../common/Icons";
import { useAlerts } from "./AlertContext";

function Alerts() {
    let alerts = useAlerts();

    useEffect(() => {
        let timeoutId = alerts.sweep();
        return () => {
            clearTimeout(timeoutId);
        };
    });

    return (
        <Container style={{position: 'absolute', top: '70px', left: '13%', zIndex: 100}}>
            {alerts.alerts.map((alert, index) => {
                const onClose = () => alerts.close(alert);
                return (
                    <Alert key={index} className="mt-3" variant={alert.variant} onClose={onClose} dismissible>
                        {icons.icon(alert.icon)} {alert.message}
                    </Alert>
                )
            })}
        </Container>
    );
}

export default Alerts;