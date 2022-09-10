import { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { useAlerts } from "../../../components/notifications/AlertContext";
import MotionVideoList from "../../../components/videos/MotionVideoList";
import { pitsService } from "../../../lib/services";

function TagMutate() {
    const alerts = useAlerts();
    const navigate = useNavigate();
    const { tagId } = useParams();
    const create = tagId === 'new';
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    const [ formData, setFormData ] = useState({
        name: create ? '' : tagId,
        description: ''
    });
    const [ content, setContent ] = useState({
        id: tagId,
        loading: !create
    });
    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.tags().get(tagId)
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
        }
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
            const submit = d => {
                return create ?
                    pitsService.tags().create(d) :
                    pitsService.tags().update(tagId, d);
            }
            submit(formData)
                .then(resp => {
                    alerts.success(`Successfully submitted ${resp.name}.`);
                    navigate("/account/tags");
                })
                .catch(e => {
                    alerts.error(`Failed to submit ${formData.name}: ${e.message}`);
                    setData({
                        submitting: false,
                        validated: false
                    });
                });
        }
    };

    const inputOnChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        });
    }

    const disabled = data.submitting || content.loading;

    return (
        <>
            <AccountBreadcrumb/>
            <Container>
                <Header>
                    { create ? 'Create Tag' : `Update ${formData.name}` }
                </Header>

                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="name">
                        <Form.Label>Name</Form.Label>
                        <Form.Control disabled={disabled || !create} onChange={inputOnChange} required name="name" value={formData.name} placeholder="Name"/>
                        <Form.Control.Feedback type="invalid">
                            Please provide a name.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control onChange={inputOnChange} disabled={disabled} name="description" value={formData.description} as="textarea"/>
                    </Form.Group>
                    <CancelButton className="me-1" disabled={disabled}/>
                    <Button disabled={disabled} type="submit" variant="success">
                        { create ? 'Create' : 'Update' }
                    </Button>
                </Form>
            </Container>
            {!create && <MotionVideoList tagId={tagId}/>}
        </>
    )
}

export default TagMutate;