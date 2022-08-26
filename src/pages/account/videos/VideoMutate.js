import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import MotionVideo from "../../../components/cameras/MotionVideo";
import CancelButton from "../../../components/common/CancelButton";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { icons } from "../../../components/common/Icons";
import { useAlerts } from "../../../components/notifications/AlertContext";
import { formatDate, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";

function VideoMutate() {
    const navigate = useNavigate();
    const alerts = useAlerts();
    const { motionVideo, cameraId } = useParams();
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    const [ cameraData, setCameraData ] = useState({
        loading: true,
    })
    const [ formData, setFormData ] = useState({
        duration: '',
        description: '',
        loading: true
    });
    useEffect(() => {
        let isMounted = true;
        if (formData.loading) {
            pitsService.videos().resource(motionVideo, 'cameras').get(cameraId).then(resp => {
                if (isMounted) {
                    setFormData({
                        ...formData,
                        ...resp,
                        loading: false
                    });
                }
            });
        }
        if (cameraData.loading) {
            pitsService.cameras().get(cameraId).then(resp => {
                if (isMounted) {
                    setCameraData({
                        ...resp,
                        loading: false
                    });
                }
            });
        }
        return () =>{
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
            pitsService.videos().resource(motionVideo, 'cameras').update(cameraId, formData)
                .then(resp => {
                    alerts.success(`Successfully updated ${resp.motionVideo}.`);
                    navigate("/account/videos");
                })
                .catch(e => {
                    alerts.error(`Failed to update ${motionVideo}: ${e.message}`);
                    setData({
                        submitting: false,
                        validated: false
                    });
                });
        }
    }

    const inputChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        });
    }

    return (
        <>
            <Container>
                <Header>Update {motionVideo}</Header>
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Row>
                        <Col className="text-center">
                            <Card>
                                <Card.Header>
                                    <strong>{cameraData.displayName || cameraId}</strong>
                                </Card.Header>
                                <Card.Body>
                                    <MotionVideo
                                        thingName={cameraId}
                                        motionVideo={motionVideo}
                                    />
                                    {!formData.loading &&
                                    <p className="mt-2 mb-0">
                                        <strong>Created At: </strong>
                                        {formatDate(formData.createTime)} {formatTime(formData.createTime)}
                                    </p>
                                    }
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Duration (in seconds)</Form.Label>
                                    <Form.Control name="duration" onChange={inputChange} disabled={formData.loading} value={formData.duration} required type="number"/>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control name="description" onChange={inputChange} as="textarea" disabled={formData.loading} value={formData.description}/>
                                </Form.Group>
                            </Row>
                            <Row>
                                <Col className="text-center">
                                    <CancelButton className="me-2" disabled={data.submitting}/>
                                    <Button className="me-2" as={Link} to={`/account/cameras/${cameraId}/configuration`} disabled={data.submitting} variant="primary">{icons.icon('card-list')} Configure</Button>
                                    <Button disabled={data.submitting || formData.loading} type="submit" variant="success">Update</Button> 
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
                <Footer/>
            </Container>
        </>
    );
}

export default VideoMutate;