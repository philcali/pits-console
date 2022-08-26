import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import CameraCard from "../../../components/cameras/CameraCard";
import CancelButton from "../../../components/common/CancelButton";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { useAlerts } from "../../../components/notifications/AlertContext";
import AssociateControl from "../../../components/resource/AssociateControl";
import { pitsService } from "../../../lib/services";

function CameraMutate() {
    const alerts = useAlerts();
    const navigate = useNavigate();
    const { cameraId } = useParams();
    const create = cameraId === 'new';
    let [ formData, setFormData ] = useState({
        thingName: create ? '' : cameraId,
        displayName: '',
        description: ''
    });
    let [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    let [ content, setContent ] = useState({
        id: cameraId,
        selectedGroup: '',
        loading: !create
    });
    let [ thingGroups, setThingGroups ] = useState({
        items: [],
        nextToken: null,
        loading: create
    });
    let [ selectedThings, setSelectedThings ] = useState({
        items: [],
        nextToken: null,
        loading: false
    });
    let [ clickedThing, setClickedThing ] = useState('');

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.cameras().get(cameraId)
                .then(existing => {
                    if (isMounted) {
                        setFormData(existing);
                    }
                })
                .finally(() => {
                    if (isMounted) {
                        setContent({
                            ...content,
                            loading: false
                        });
                    }
                });
        }
        if (thingGroups.loading) {
            pitsService.thingGroups().list({ nextToken: thingGroups.nextToken })
                .then(resp => {
                    if (isMounted) {
                        setThingGroups({
                            ...thingGroups,
                            items: thingGroups.items.concat(resp.items),
                            nextToken: resp.nextToken,
                            loading: resp.nextToken !== null
                        });
                    }
                })
                .catch(err => {
                    alerts.error(`Failed to load Thing Groups: ${err.message}`);
                    if (isMounted) {
                        setThingGroups({
                            ...thingGroups,
                            loading: false
                        })
                    }
                });
        }
        if (selectedThings.loading) {
            pitsService.thingGroups().resource(content.selectedGroup, 'things').list({ nextToken: selectedThings.nextToken })
                .then(resp => {
                    if (isMounted) {
                        let loading = resp.nextToken !== null;
                        let items = selectedThings.items.concat(resp.items);
                        setSelectedThings({
                            ...selectedThings,
                            nextToken: resp.nextToken,
                            items,
                            loading
                        });
                    }
                })
                .catch(err => {
                    alerts.error(`Failed to load Things in ${content.selectedGroup}: ${err.message}`);
                    if (isMounted) {
                        selectedThings({
                            ...selectedThings,
                            loading: false
                        })
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    });

    const handleSubmit = event => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        if (form.checkValidity() === false) {
            setData({
                ...data,
                validated: true
            });
        } else {
            setData({
                ...data,
                validated: true,
                submitting: true
            });
            if (create) {
                pitsService.cameras().create(formData)
                    .then(resp => {
                        alerts.success(`Successfully created ${resp.thingName}.`);
                        navigate("/account/cameras");
                    })
                    .catch((e) => {
                        alerts.error(`Failed to create ${formData.thingName}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        })
                    });
            } else {
                pitsService.cameras().update(cameraId, formData)
                    .then(resp => {
                        alerts.success(`Successfully updated ${resp.thingName}.`);
                        navigate("/account/cameras");
                    })
                    .catch((e) => {
                        alerts.error(`Failed to update ${formData.thingName}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        })
                    });
            }
        }
    };

    const inputOnChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    const thingGroupChange = event => {
        setContent({
            ...content,
            selectedGroup: event.currentTarget.value
        })
        setSelectedThings({
            ...selectedThings,
            items: [],
            nextToken: null,
            loading: event.currentTarget.value !== ''
        })
    };

    const selectThingForCamera = thingName => {
        return event => {
            setClickedThing(thingName);
            setFormData({
                ...formData,
                thingName
            });
        };
    };

    const disabled = content.loading || data.submitting;

    return (
        <>
            <Container>
                <Header>
                    {create ? 'Create Camera' : `Update ${formData.thingName}`}
                </Header>
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    {create &&
                    <>
                        <Form.Group className="mb-3">
                            <Form.Label>Thing Group</Form.Label>
                            <Form.Select onChange={thingGroupChange}>
                                <option value=''>Select a Thing Group</option>
                                <optgroup label="—————————">
                                    {thingGroups.items.map(group => {
                                        return <option key={group.groupArn}>{group.groupName}</option>
                                    })}
                                </optgroup>
                            </Form.Select>
                        </Form.Group>
                        <Row xs={1} md={3} className="mb-3">
                            {selectedThings.items.map((thing, ti) => {
                                let variant = !clickedThing ? 'light' : clickedThing === thing ? 'secondary' : 'dark';
                                return (
                                    <Col key={`thing-${ti}`} className="text-center">
                                        <CameraCard
                                            thingName={thing}
                                            variant={variant}
                                            onClick={selectThingForCamera(thing)}
                                        />
                                    </Col>
                                );
                            })}
                        </Row>
                    </>
                    }
                    {formData.thingName &&
                    <>
                        <Form.Group className="mb-3" controlId="displayName">
                            <Form.Label>Display Name</Form.Label>
                            <Form.Control disabled={disabled} required name="displayName" onChange={inputOnChange} value={formData.displayName} placeholder="Display Name"/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a Display Name.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control disabled={disabled} name="description" value={formData.description} onChange={inputOnChange} as='textarea'/>
                        </Form.Group>
                        <AssociateControl
                            title="Groups"
                            resource="cameras"
                            resourceId={formData.thingName}
                            associatedResource="groups"
                            associatedResourceId="name"
                        />
                    </>
                    }
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting || !formData.thingName} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
                <Footer/>
            </Container>
        </>
    )
}

export default CameraMutate;