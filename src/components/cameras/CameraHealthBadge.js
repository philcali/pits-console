import { useEffect, useState } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { pitsService } from "../../lib/services";
import { icons } from "../common/Icons";
import { useAlerts } from "../notifications/AlertContext";

function CameraHealthBadge({ thingName, latestVersion }) {
    const alerts = useAlerts();
    const navigate = useNavigate();
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
        <>
            {health.version &&
                <>
                    {' - '}
                    <strong>[{health.version}]</strong>
                    {latestVersion && health.version.localeCompare(latestVersion) < 0 &&
                        <span style={{ float: 'left' }}>
                            <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip id={`button-update-${thingName}`}>
                                        Update your device to {latestVersion}
                                    </Tooltip>
                                }
                            >

                                <Button
                                    onClick={() => navigate(`/account/jobs/new?type=update&targetType=cameras&targetId=${thingName}&version=${latestVersion}`)}
                                    size="sm"
                                    variant="danger">{icons.icon('exclamation-triangle')}</Button>
                            </OverlayTrigger>
                        </span>
                    }
                </>
            }
            <span style={{float: 'right'}}>
                <Button as={Link} to={`/account/stats/${thingName}`} variant={variant} size="sm">
                    {icons.icon(icon)}
                </Button>
            </span>
        </>
    );
}

export default CameraHealthBadge;