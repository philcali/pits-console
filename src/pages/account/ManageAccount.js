import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import MotionVideo from "../../components/cameras/MotionVideo";
import AccountBreadcrumb from "../../components/common/AccountBreadcrumb";
import Header from "../../components/common/Header";
import { icons } from "../../components/common/Icons";
import { useAlerts } from "../../components/notifications/AlertContext";
import { formatDate, formatTime } from "../../lib/format";
import { pitsService } from "../../lib/services";

function ResourceCard(props) {
    const alerts = useAlerts();
    const [ resource, setResource ] = useState({
        total: 0,
        nextToken: null,
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (resource.loading) {
            pitsService[props.resource]().list({ nextToken: resource.nextToken })
                .then(resp => {
                    if (isMounted) {
                        setResource({
                            ...resource,
                            total: resp.items.length + resource.total,
                            nextToken: resp.nextToken,
                            loading: resp.nextToken !== null
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load ${props.resource}: ${e.message}`);
                    if (isMounted) {
                        setResource({
                            ...resource,
                            total: 'NA',
                            loading: false
                        });
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    });

    return (
        <Card className="text-center">
            <Card.Header as="h4">{props.title}</Card.Header>
            <Card.Body>
                {resource.loading && <Spinner animation="border"/>}
                {!resource.loading &&
                    <h1><Link style={{ textDecoration: 'solid' }} className="link-success" to={`/account/${props.resource}`}>{resource.total}</Link></h1>
                }
            </Card.Body>
        </Card>
    )   
}

function LatestCapturedVideoCard() {
    const alerts = useAlerts();
    const [ latestVideo, setLatestVideo ] = useState({
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (latestVideo.loading) {
            pitsService.videos().list({ limit: 1 })
                .then(resp => {
                    if (isMounted) {
                        setLatestVideo({
                            ...latestVideo,
                            ...(resp.items[0] || {}),
                            loading: false
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load latest video: ${e.message}`);
                    setLatestVideo({
                        loading: false
                    });
                });
        }
        return () => {
            isMounted = false;
        };
    });

    return (
        <Card className="text-center">
            <Card.Header as="h4">Latest Motion Video</Card.Header>
            <Card.Body>
                {latestVideo.loading && <Spinner animation="border"/>}
                {(!latestVideo.loading && latestVideo.motionVideo) &&
                    <>
                        <MotionVideo
                            motionVideo={latestVideo.motionVideo}
                            thingName={latestVideo.thingName}/>
                        <br/>
                        <small>Captured on <strong>{formatDate(latestVideo.createTime)} {formatTime(latestVideo.createTime)}</strong></small>
                    </>
                }
            </Card.Body>
            <Card.Footer>
                <Button onClick={event => setLatestVideo({loading: true})} variant="outline-secondary">{icons.icon('arrow-clockwise')} Refresh</Button>
                <Button className="ms-1" variant="outline-success" as={Link} to="/account/videos">All Videos</Button>
            </Card.Footer>
        </Card>
    );
}

function ManageAccount() {
    return (
        <>
            <AccountBreadcrumb/>
            <Container>
                <Header>Manage Account</Header>
                <Row xs={1} md={3}>
                    {["Groups", "Cameras", "Subscriptions"].map(resource => {
                        return (
                            <Col key={`resource-${resource}`}>
                                <ResourceCard
                                    title={resource}
                                    resource={resource.toLowerCase()}
                                />
                            </Col>
                        );
                    })}
                </Row>
                <Row className="mt-3" xs={1} md={2}>
                    <Col>
                        <LatestCapturedVideoCard/>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default ManageAccount;