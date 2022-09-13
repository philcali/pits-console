import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import MotionVideo from "../../components/cameras/MotionVideo";
import AccountBreadcrumb from "../../components/common/AccountBreadcrumb";
import Header from "../../components/common/Header";
import { icons } from "../../components/common/Icons";
import ProvideResource from "../../components/common/ProvideResource";
import { useResource } from "../../components/common/ResourceContext";
import { formatDate, formatTime } from "../../lib/format";

function ResourceCard(props) {
    const resource = useResource();
    const total = resource.items.length;

    return (
        <Card className="text-center mt-2">
            <Card.Header as="h4">{props.title}</Card.Header>
            <Card.Body>
                {resource.loading && <Spinner animation="border"/>}
                {!resource.loading &&
                    <h1><Link style={{ textDecoration: 'solid' }} className="link-success" to={`/account/${resource.name}`}>{total}</Link></h1>
                }
            </Card.Body>
        </Card>
    )   
}

function LatestCapturedVideoCard() {
    const resource = useResource();
    const latestVideo = resource.items[0];
    return (
        <Card className="text-center">
            <Card.Header as="h4">Latest Motion Video</Card.Header>
            <Card.Body>
                {resource.loading && <Spinner animation="border"/>}
                {(!resource.loading && latestVideo.motionVideo) &&
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
                <Button onClick={event => resource.reload()} variant="outline-secondary">{icons.icon('arrow-clockwise')} Refresh</Button>
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
                <Row xs={1} lg={4} md={2}>
                    {["Groups", "Cameras", "Subscriptions", "Tags"].map(resource => {
                        return (
                            <Col key={`resource-${resource}`}>
                                <ProvideResource resource={resource.toLowerCase()}>
                                    <ResourceCard title={resource}/>
                                </ProvideResource>
                            </Col>
                        );
                    })}
                </Row>
                <Row className="mt-3" xs={1} lg={2} md={1}>
                    <Col>
                        <ProvideResource resource="videos" manuallyPage={true}>
                            <LatestCapturedVideoCard/>
                        </ProvideResource>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default ManageAccount;