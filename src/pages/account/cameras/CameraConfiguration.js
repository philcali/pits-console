import { useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import CameraCard from "../../../components/cameras/CameraCard";
import CancelButton from "../../../components/common/CancelButton";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { useAlerts } from "../../../components/notifications/AlertContext";
import { pitsService } from "../../../lib/services";

const LEVELS = [
    '1', '1b', '1.1', '1.2', '1.3',
    '2', '2.1', '2.2',
    '3', '3.1', '3.2',
    '4', '4.1', '4.2'
];

function CameraConfiguration() {
    const alerts = useAlerts();
    const { cameraId } = useParams();
    const [ cameraData, setCameraData ] = useState({
        loading: true
    });
    const [ formData, setFormData ] = useState({
        buffer: '',
        sensitivity: '',
        rotation: '',
        resolution_height: '',
        resolution_width: '',
        recording_window: '',
        encoding_bitrate: '',
        encoding_level: '',
        encoding_profile: '',
        framerate: '',
        loading: true
    });
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    })

    useEffect(() => {
        let isMounted = true;
        if (formData.loading) {
            pitsService.cameras().resource(cameraId, 'configuration').list()
                .then(configuration => {
                    if (isMounted) {
                        let [ resolution_width, resolution_height ] = configuration.resolution.split('x');
                        let [ recording_start, recording_end ] = configuration.recording_window.split('-');
                        setFormData({
                            ...configuration,
                            resolution_width,
                            resolution_height,
                            recording_start,
                            recording_end,
                            loading: false
                        });
                    }
                })
                .catch(error => {
                    alerts.error(`Failed to load configuration: ${error.message}`);
                    if (isMounted) {
                        setFormData({
                            ...formData,
                            loading: false
                        })
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
            })
            .catch(e => {
                alerts.error(`Failed to load ${cameraId}.`);
                setCameraData({
                    loading: false,
                })
            })
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
            let payload = {
                recording_window: [formData.recording_start, formData.recording_end].join('-'),
                resolution: [formData.resolution_width, formData.resolution_height].join('x')
            };
            for (let key in formData) {
                if (key === 'loading' || key.match(/^recording_/) || key.match(/^resolution/)) {
                    continue;
                }
                payload[key] = formData[key];
            }
            pitsService.cameras().resource(cameraId, 'configuration').create(payload)
                .then(result => {
                    alerts.success(`Successfully updated configuration for ${cameraId}`);
                })
                .catch(error => {
                    alerts.error(`Failed to update configuration for ${cameraId}: ${error.message}`);
                })
                .finally(() => {
                    setData({
                        submitting: false,
                        validated: false
                    });
                });
        }
    };

    const inputChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    return (
        <>
            <Container>
                <Header>
                    Configuring {cameraData.displayName || cameraId}
                </Header>
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Row>
                        <Col className="text-center">
                            <CameraCard displayName={cameraData.displayName} thingName={cameraId}/>
                        </Col>
                        <Col>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Buffer</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" disabled={formData.loading} value={formData.buffer} required name="buffer"/>
                                </Form.Group>
                                <Form.Group as={Col}>
                                    <Form.Label>Sensitivity</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" disabled={formData.loading} value={formData.sensitivity} name="sensitivity"/>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Rotation</Form.Label>
                                    <Form.Select disabled={formData.loading} onChange={inputChange} name="rotation" value={formData.rotation}>
                                        {[0, 90, 180, 270].map((degree, index) => <option key={`degree-${index}`} value={degree}>{degree}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col}>
                                    <Form.Label>Framerate</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" disabled={formData.loading} value={formData.framerate} required name="framerate"/>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Resolution Width</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" disabled={formData.loading} value={formData.resolution_width} name="resolution_width"/>
                                </Form.Group>
                                <Form.Group as={Col}>
                                    <Form.Label>Resolution Height</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" disabled={formData.loading} value={formData.resolution_height} name="resolution_height"/>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="recording_start">
                                    <Form.Label>Recording Window Start</Form.Label>
                                    <Form.Select disabled={formData.loading} onChange={inputChange} name="recording_start" value={formData.recording_start}>
                                        {Array(24).fill().map((num, index) => <option key={`start-${index}`} value={index}>{index}</option>)}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col}>
                                    <Form.Label>Recording Window End</Form.Label>
                                    <Form.Select disabled={formData.loading} onChange={inputChange} name="recording_end" value={formData.recording_end}>
                                        {Array(24).fill().map((num, index) => <option key={`end-${index}`} value={index}>{index}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Encoding Profile</Form.Label>
                                    <Form.Select onChange={inputChange} name="encoding_profile" disabled={formData.loading} value={formData.encoding_profile}>
                                        {['baseline', 'main', 'extended', 'high', 'constrained'].map(profile => {
                                            return <option key={`encoding-${profile}`} value={profile}>{profile}</option>
                                        })}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group as={Col}>
                                    <Form.Label>Encoding Level</Form.Label>
                                    <Form.Select onChange={inputChange} disabled={formData.loading} value={formData.encoding_level} name="encoding_level">
                                        {LEVELS.map((level, index) => <option key={`level-${index}`} value={level}>{level}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Encoding Bitrate</Form.Label>
                                    <Form.Control onChange={inputChange} type="number" step={1000} disabled={formData.loading} value={formData.encoding_bitrate} required name="encoding_bitrate"/>
                                </Form.Group>
                            </Row>
                            <Row>
                                <Col className="text-center">
                                    <CancelButton className="me-2" disabled={data.submitting}/>
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

export default CameraConfiguration;