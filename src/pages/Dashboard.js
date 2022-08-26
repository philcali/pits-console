import { useEffect, useState } from "react";
import { Col, Container, Row, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import CameraCard from "../components/cameras/CameraCard";
import Footer from "../components/common/Footer";
import { pitsService } from "../lib/services";

function Dashboard() {
    let [ groups, setGroups ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });

    let [ camerasToGroup, setCamerasToGroup ] = useState({
        groups: {},
        loading: false
    });

    let [ batchCameras, setBatchCameras ] = useState({
        cameras: {},
        loading: false
    });

    useEffect(() => {
        let isMounted = true;
        if (groups.loading) {
            pitsService.groups().list({ nextToken: groups.nextToken })
                .then(resp => {
                    if (isMounted) {
                        let loading = resp.nextToken !== null;
                        let newGroups = {
                            ...groups,
                            items: groups.items.concat(resp.items),
                            nextToken: resp.nextToken,
                            loading
                        };
                        setGroups(newGroups);
                        if (!loading) {
                            let triggerToLoad = {};
                            newGroups.items.forEach(item => {
                                triggerToLoad[item.name] = {
                                    items: [],
                                    nextToken: null,
                                    loading: true
                                };
                            });
                            setCamerasToGroup({
                                groups: triggerToLoad,
                                loading: true
                            });
                        }
                    }
                });
        }
        if (camerasToGroup.loading) {
            let promises = [];
            let groupNames = [];
            for (let groupName in camerasToGroup.groups) {
                let group = camerasToGroup.groups[groupName];
                if (!group.loading) {
                    continue;
                }
                promises.push(pitsService.groups()
                    .resource(groupName, 'cameras')
                    .list({ nextToken: group.nextToken }));
                groupNames.push(groupName);
            }
            Promise.all(promises).then(results => {
                let newGroups = {...camerasToGroup.groups};
                let loading = false;
                results.forEach((result, index) => {
                    let existingGroup = newGroups[groupNames[index]];
                    let childLoading = result.nextToken !== null
                    newGroups[groupNames[index]] = {
                        ...existingGroup,
                        items: existingGroup.items.concat(result.items),
                        nextToken: result.nextToken,
                        loading: childLoading
                    };
                    loading = loading || childLoading;
                });
                if (isMounted) {
                    setCamerasToGroup({
                        ...camerasToGroup,
                        groups: newGroups,
                        loading
                    });
                    if (!loading) {
                        setBatchCameras({
                            ...batchCameras,
                            loading: true
                        })
                    }
                }
            })
        }
        if (batchCameras.loading) {
            let thingName = [];
            for (let groupName in camerasToGroup.groups) {
                camerasToGroup.groups[groupName].items
                    .forEach(item => thingName.push(item.id));
            }
            pitsService.cameras().list({ 'thingName': thingName }).then(resp => {
                if (isMounted) {
                    let cameras = {};
                    resp.items.forEach(item => {
                        cameras[item.thingName] = item.displayName;
                    })
                    setBatchCameras({
                        cameras,
                        loading: false
                    });
                }
            });
        }
        return () => {
            isMounted = false;
        }
    });

    const isEmpty = !groups.loading && groups.items.length === 0;

    return (
        <Container>
            {groups.loading && <Spinner className="mt-3" animation="border"/>}
            {!(groups.loading) && groups.items.map(group => {
                let cameras = camerasToGroup.groups[group.name];
                let camerasIsEmpty = (cameras && !cameras.loading && cameras.items.length === 0);
                return (
                    <div key={`cameras-${group.name}`}>
                        <h2 className="mt-3 pb-3 mb-3" style={{borderBottom: '1px solid #ddd'}}>{group.name} Cameras</h2>
                        {camerasIsEmpty &&
                        <p>
                            Looks like there are no <Link to="/account/cameras">cameras</Link> associated to <Link to={`/account/groups/${group.name}`}>{group.name}</Link>.
                        </p>
                        }
                        {!camerasIsEmpty &&
                        <Row xs={1} md={3}>
                            {(cameras || { items: [] }).items.map(camera => {
                                return (
                                    <Col key={`camera-${group.name}-${camera.id}`} className="text-center">
                                        <CameraCard thingName={camera.id} displayName={batchCameras.cameras[camera.id]}/>
                                    </Col>
                                );
                            })}
                        </Row>
                        }
                    </div>
                );
            })}
            {isEmpty &&
                <div>
                    <h2 class="mt-3 pb-3 mb-3" style={{ borderBottom: '1px solid #ddd' }}>No Groups</h2>
                    <p>
                        It looks like you do not have any groups.
                        Head over to <Link to="/account/groups">Groups</Link> to create and manage groups.
                    </p>
                </div>
            }
            <Footer/>
        </Container>
    );
}

export default Dashboard;