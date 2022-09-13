import { Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import CameraCard from "../components/cameras/CameraCard";
import Header from "../components/common/Header";
import ProvideResource from "../components/common/ProvideResource";
import { useResource } from "../components/common/ResourceContext";

function Groups() {
    const resource = useResource();
    const isEmpty = resource.items.length === 0;
    return (
        <>
            {resource.loading && <Spinner className="mt-3" animation="border"/>}
            {!resource.loading &&
                <>
                    {isEmpty &&
                        <Container>
                            <Header>No Groups</Header>
                            <p>
                                No groups are defined. Head over to <Link to="/account/groups">Groups</Link> to begin.
                            </p>
                        </Container>
                    }
                    {resource.items.map(group => {
                        return (
                            <Container className="mt-3" key={`group-${group.name}`}>
                                <Header>{group.name}</Header>
                                <ProvideResource resource={resource.api.resource(group.name, "cameras")}>
                                    <GroupCameras group={group}/>
                                </ProvideResource>
                            </Container>
                        )
                    })}
                </>
            }
        </>
    )
}

function Cameras() {
    const resource = useResource();
    resource.items.sort((left, right) => left.thingName.localeCompare(right.thingName));

    return (
        <>
            {resource.loading && <Col><Spinner animation="border"/></Col>}
            {!resource.loading &&
                <>
                    {resource.items.map(camera => {
                        return (
                            <Col className="text-center" key={`camera-${camera.thingName}`}>
                                <CameraCard thingName={camera.thingName} displayName={camera.displayName}/>
                            </Col>
                        )
                    })}
                </>
            }
        </>
    );
}

function GroupCameras({ group }) {
    const resource = useResource();
    const isEmpty = resource.items.length === 0;
    return (
        <>
            {resource.loading && <Row><Col><Spinner animation="border"/></Col></Row>}
            {!resource.loading &&
                <>
                    {isEmpty &&
                        <Row>
                            <Col>
                                <p>Looks like there are no associated
                                    <Link to="/account/cameras">Cameras</Link> for
                                    <Link to={`/account/groups/${group.name}`}>{group.name}</Link>.
                                </p>
                            </Col>
                        </Row>
                    }
                    {!isEmpty &&
                        <ProvideResource additionalParams={{ thingName: resource.items.map(item => item.id) }} resource="cameras">
                            <Row>
                                <Cameras/>
                            </Row>
                        </ProvideResource>
                    }
                </>
            }
        </>
    );
}



function Dashboard() {
    return (
        <ProvideResource resource="groups">
            <Groups/>
        </ProvideResource>
    );
}

export default Dashboard;