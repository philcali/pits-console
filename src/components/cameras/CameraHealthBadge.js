import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { pitsService } from "../../lib/services";
import { icons } from "../common/Icons";
import { useAlerts } from "../notifications/AlertContext";

function CameraHealthBadge({ thingName }) {
    const alerts = useAlerts();
    const [ health, setHealth ] = useState({
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (health.loading) {
            pitsService.stats().list({ thingName: [thingName] })
                .then(resp => {
                    if (isMounted) {
                        setHealth({
                            ...resp.items[0],
                            loading: false
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load health for ${thingName}: ${e.message}`);
                    if (isMounted) {
                        setHealth({
                            loading: false
                        });
                    }
                })
        }
        return () => {
            isMounted = false;
        }
    });

    let variant = 'secondary';
    let icon = 'activity';
    if (health.status === 'UNHEALTHY') {
        variant = 'danger';
        icon = 'dash-circle';
    } else {
        variant = 'success';
        icon = 'check-circle';
    }

    return (
        <span style={{float: 'right'}}>
            <Button as={Link} to={`/account/stats/${thingName}`} variant={variant} size="sm">
                {icons.icon(icon)}
            </Button>
        </span>
    );
}

export default CameraHealthBadge;