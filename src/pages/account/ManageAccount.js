import { Button, Card, Col, Container, Row, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import MotionVideo from "../../components/cameras/MotionVideo";
import AccountBreadcrumb from "../../components/common/AccountBreadcrumb";
import Header from "../../components/common/Header";
import { icons } from "../../components/common/Icons";
import ProvideResource from "../../components/resource/ProvideResource";
import { useResource } from "../../components/resource/ResourceContext";
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

function LatestCapturedVideoCard({ cameras }) {
    const resource = useResource();
    const latestVideo = resource.items[0];
    const displayNameMap = {};
    cameras.forEach(camera => {
        displayNameMap[camera.thingName] = camera.displayName;
    });
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
                        <small>Captured by <Link to={`/account/cameras/${latestVideo.thingName}/configuration`}>{displayNameMap[latestVideo.thingName]}</Link> on <strong>{formatDate(latestVideo.createTime)} {formatTime(latestVideo.createTime)}</strong></small>
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

function LatestHealthTable({ cameras }) {
    const resource = useResource();
    const displayNameMap = {};
    cameras.forEach(camera => {
        displayNameMap[camera.thingName] = camera.displayName;
    })
    return (
        <Table responsive>
            <thead>
                <tr>
                    <th>Camera</th>
                    <th className="text-center">Last Check</th>
                    <th className="text-center">Health</th>
                    <th className="text-center">Recording</th>
                </tr>
            </thead>
            <tbody>
                {resource.loading &&
                    <tr>
                        <td className="text-center" colSpan={4}><Spinner animation="border"/></td>
                    </tr>
                }
                {!resource.loading &&
                    <>
                        {resource.items.map(stat => {
                            const isDown = stat.status === 'UNHEALTHY';
                            return (
                                <tr key={`stat-${stat.thing_name}-${stat.timestamp}`}>
                                    <td><Link to={`/account/cameras/${stat.thing_name}`}>{displayNameMap[stat.thing_name]}</Link></td>
                                    <td className="text-center">{formatDate(stat.timestamp)} {formatTime(stat.timestamp)}</td>
                                    <td className={`text-center text-${isDown ? 'danger' : 'success'}`}>{icons.icon(isDown ? 'dash-circle' : 'check-circle')}</td>
                                    <td className={`text-center text-${stat.recording_status ? 'success' : 'danger'}`}>{icons.icon(stat.recording_status ? 'camera-video' : 'camera-video-off')}</td>
                                </tr>
                            )
                        })}
                    </>
                }
            </tbody>
        </Table>
    );
}

function LatestDeviceHealth() {
    const resource = useResource();
    return (
        <Card>
            <Card.Header className="text-center" as="h4">Latest Camera Health</Card.Header>
            <Card.Body>
                {resource.loading && <Spinner animation="border"/>}
                {!resource.loading &&
                    <ProvideResource additionalParams={{ thingName: resource.items.map(item => item.thingName) }} resource="stats">
                        <LatestHealthTable cameras={resource.items}/>
                    </ProvideResource>
                }
            </Card.Body>
            <Card.Footer className="text-center">
                <Button disabled={resource.loading} onClick={event => resource.reload()} variant="outline-secondary">{icons.icon('arrow-clockwise')} Refresh</Button>
                <Button as={Link} to="/account/stats" className="ms-1" disabled={resource.loading} variant="outline-success">More Details</Button>
            </Card.Footer>
        </Card>
    )
}

function DashboardContent() {
    const resource = useResource();
    return (
        <Container>
            <Header>Manage Account</Header>
            <Row xs={1} lg={4} md={2}>
                {["Groups", "Cameras", "Subscriptions", "Tags"].map(resource => {
                    return (
                        <Col key={`resource-${resource}`}>
                            {resource === "Cameras" && <ResourceCard title={resource}/> }
                            {resource !== "Cameras" &&
                                <ProvideResource resource={resource.toLowerCase()}>
                                    <ResourceCard title={resource}/>
                                </ProvideResource>
                            }
                        </Col>
                    );
                })}
            </Row>
            <Row className="mt-3" xs={1} lg={2} md={1}>
                <Col className="mt-2">
                    <ProvideResource resource="videos" manuallyPage={true}>
                        <LatestCapturedVideoCard cameras={resource.items}/>
                    </ProvideResource>
                </Col>
                <Col className="mt-2">
                    <LatestDeviceHealth/>
                </Col>
            </Row>
        </Container>
    );
}

function ManageAccount() {
    return (
        <>
            <AccountBreadcrumb/>
            <ProvideResource resource="cameras">
                <DashboardContent/>
            </ProvideResource>
        </>
    )
}

export default ManageAccount;