import { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import CancelButton from "../../../components/common/CancelButton";
import Footer from "../../../components/common/Footer";
import { useAlerts } from "../../../components/notifications/AlertContext";
import AssociateControl from "../../../components/resource/AssociateControl";
import { pitsService } from "../../../lib/services";

function CreateGroup() {
    let { groupId } = useParams();
    let create = groupId === 'new';
    let [ formData, setFormData ] = useState({
        name: create ? '' : groupId,
        description: ''
    });
    let [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    let [ content, setContent ] = useState({
        id: groupId,
        loading: !create
    });

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.groups().get(groupId)
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
        return () => {
            isMounted = false;
        };
    });

    const alerts = useAlerts();
    const navigate = useNavigate();
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
                pitsService.groups().create(formData)
                    .then(resp => {
                        alerts.success(`Successfully created ${resp.name}.`);
                        navigate("/account/groups");
                    })
                    .catch((e) => {
                        alerts.error(`Failed to create ${formData.name}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        })
                    });
            } else {
                pitsService.groups().update(groupId, formData)
                    .then(resp => {
                        alerts.success(`Successfully updated ${resp.name}.`);
                        navigate("/account/groups");
                    })
                    .catch((e) => {
                        alerts.error(`Failed to update ${formData.name}: ${e.message}`);
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

    const disabled = content.loading || data.submitting;

    return (
        <>
            <Container>
                <h2 className="pt-3 pb-2 mb-3" style={{ borderBottom: '1px solid #ddd' }}>
                    {create ? 'Create Group' : `Update ${formData.name}`}
                </h2>

                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="name">
                        <Form.Label>Name</Form.Label>
                        <Form.Control disabled={disabled || !create} required name="name" onChange={inputOnChange} value={formData.name} placeholder="Name"/>
                        <Form.Control.Feedback type="invalid">
                            Please provide a name.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control disabled={disabled} name="description" value={formData.description} onChange={inputOnChange} as='textarea'/>
                    </Form.Group>
                    {!create &&
                        <AssociateControl
                            title="Cameras"
                            resource="groups"
                            resourceId={formData.name}
                            associatedResource="cameras"
                            associatedResourceId="thingName"
                        />
                    }
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
                <Footer/>
            </Container>
        </>
    );
}

export default CreateGroup;