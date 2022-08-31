import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
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
        protocol: 'email'
    });
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    const [ content, setContent ] = useState({
        id,
        loading: !create
    });

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.subscriptions().get(id)
                .then(existing => {
                    if (isMounted) {
                        setFormData(existing);
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
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
            </Container>
        </>
    );
}

export default SubscriptionMutate;