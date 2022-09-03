import { useEffect, useState } from "react";
import { Button, ButtonGroup, Col, Container, Form, Row, ToggleButton } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../components/auth/AuthContext";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { useAlerts } from "../../../components/notifications/AlertContext";
import { pitsService } from "../../../lib/services";

function SubscriptionMutate() {
    const alerts = useAlerts();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();
    const create = id === 'new';
    const [ formData, setFormData ] = useState({
        id: create ? '' : id,
        endpoint: user.email || '',
        protocol: 'email',
        filter: {}
    });
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    const [ content, setContent ] = useState({
        id,
        loading: !create,
    });

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.subscriptions().get(id)
                .then(existing => {
                    if (isMounted) {
                        setFormData({
                            ...formData,
                            ...existing
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load subscription ${id}: ${e.message}`);
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
                pitsService.subscriptions().create(formData)
                    .then(resp => {
                        alerts.success(`Successfully created ${resp.id}.`);
                        navigate("/account/subscriptions");
                    })
                    .catch(e => {
                        alerts.error(`Failed to create ${formData.endpoint}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        });
                    });
            } else {
                pitsService.subscriptions().update(id, formData)
                    .then(resp => {
                        alerts.success(`Successfully updated ${resp.id}.`);
                        navigate("/account/subscriptions");
                    })
                    .catch(e => {
                        alerts.error(`Failed to update ${formData.endpoint}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        });
                    });

            }
        }
    };

    const inputChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        })
    };

    const updateFilter = event => {
        console.log(event);
    };

    return (
        <>
            <Container>
                <Header>
                    {create ? 'Create Subscription' : `Update ${formData.endpoint}`}
                </Header>
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label>Endpoint</Form.Label>
                            <Form.Control disabled={!create} placeholder="user@example.com" onChange={inputChange} value={formData.endpoint} name="endpoint"/>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Protocol</Form.Label>
                            <Form.Select disabled={!create} onChange={inputChange} name="protocol" value={formData.protocol}>
                                <option value="email">Email</option>
                            </Form.Select>
                        </Form.Group>
                    </Row>
                    <h3>
                        Filters
                    </h3>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label>Group</Form.Label>
                            <br/>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Camera</Form.Label>
                            <br/>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Days Of Week</Form.Label>
                            <br/>
                            <ButtonGroup vertical>
                                {['Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                                    return (
                                        <ToggleButton
                                            key={`day-${index}`}
                                            type="checkbox"
                                            checked={false}
                                            variant="outline-success"
                                            value={index}
                                            onChange={updateFilter}
                                        >
                                            {day}
                                        </ToggleButton>
                                    );
                                })}
                            </ButtonGroup>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Hours Of Day</Form.Label>
                            <br/>
                            <ButtonGroup vertical>
                                {Array(24).fill().map((num, index) => {
                                    return (
                                        <ToggleButton
                                            key={`hour-${index}`}
                                            type="checkbox"
                                            checked={false}
                                            variant="outline-success"
                                            value={index}
                                            onChange={updateFilter}
                                        >
                                            {index}
                                        </ToggleButton>
                                    )
                                })}
                            </ButtonGroup>
                        </Form.Group>
                    </Row>
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
            </Container>
        </>
    );
}

export default SubscriptionMutate;