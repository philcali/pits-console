import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
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
                }
            })
        }
        return () => {
            isMounted = false;
        }
    });

    return (
        <Container>
            {groups.items.map(group => {
                let cameras = camerasToGroup.groups[group.name];
                return (
                    <div key={`cameras-${group.name}`}>
                        <h2 className="mt-3 pb-3 mb-3" style={{borderBottom: '1px solid #ddd'}}>{group.name} Cameras</h2>
                        <Row xs={1} md={3}>
                            {(cameras || { items: [] }).items.map(camera => {
                                return (
                                    <Col key={`camera-${group.name}-${camera.id}`} className="text-center">
                                        <CameraCard thingName={camera.id}/>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                );
            })}
            <Footer/>
        </Container>
    );
}

export default Dashboard;