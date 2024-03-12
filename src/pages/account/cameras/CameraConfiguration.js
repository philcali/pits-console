import { useEffect, useState } from "react";
import { Accordion, Button, Col, Container, Form, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import CameraCard from "../../../components/cameras/CameraCard";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { icons } from "../../../components/common/Icons";
import { useAlerts } from "../../../components/notifications/AlertContext";
import MotionVideoList from "../../../components/videos/MotionVideoList";
import { pitsService } from "../../../lib/services";

const LEVELS = [
    '1', '1b', '1.1', '1.2', '1.3',
    '2', '2.1', '2.2',
    '3', '3.1', '3.2',
    '4', '4.1', '4.2'
];

const LOG_LEVELS = [
    'DEBUG',
    'INFO',
    'WARNING',
    'ERROR',
    'FATAL',
];

function CameraConfiguration() {
    const alerts = useAlerts();
    const { cameraId } = useParams();
    const [ cameraData, setCameraData ] = useState({
        loading: true
    });
    const [ formData, setFormData ] = useState({
        camera: {
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
        },
        storage: {
            enabled: true,
            bucket_name: '',
            video_prefix: 'motion_videos',
            image_prefix: 'capture_images',
        },
        cloudwatch: {
            log_level: 'INFO',
            enabled: false,
            threaded: false,
            delineate_stream: true,
            log_group_name: '/pits/device/DaemonLogging',
            metric_namespace: 'Pits/Device',
            event_type: 'logs',
        },
        health: {
            interval: 3600,
        },
        loading: false,
        storageLoading: true,
    });
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    })

    useEffect(() => {
        let isMounted = true;
        if (formData.storageLoading) {
            pitsService.storage().get('info')
                .then(storage => {
                    setFormData({
                        ...formData,
                        storage:{
                            ...formData.storage,
                            'bucket_name': storage.bucketName,
                            'video_prefix': storage.deviceVideoPrefix,
                            'image_prefix': storage.imagePrefix,
                        },
                        loading: true,
                        storageLoading: false,
                    })
                })
                .catch(e => {
                    alerts.error(`Failed to retrieve site storage settings: ${e.message}`);
                })
        }
        if (formData.loading) {
            let documents = [
                'camera',
                'storage',
                'cloudwatch',
                'health',
            ]
            pitsService.cameras().resource(cameraId, 'configuration').list({'document': documents})
                .then(configuration => {
                    if (isMounted) {
                        let [ resolution_width, resolution_height ] = configuration.camera.resolution.split('x');
                        let [ recording_start, recording_end ] = configuration.camera.recording_window.split('-');
                        setFormData({
                            camera: {
                                ...configuration.camera,
                                resolution_width,
                                resolution_height,
                                recording_start,
                                recording_end,
                            },
                            storage: {
                                ...(configuration.storage || formData.storage),
                            },
                            cloudwatch: {
                                ...(configuration.cloudwatch || formData.cloudwatch),
                            },
                            health: {
                                ...(configuration.health || formData.health),
                            },
                            loading: false,
                            storageLoading: false,
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
                camera: {
                    recording_window: [
                        formData.camera.recording_start,
                        formData.camera.recording_end
                    ].join('-'),
                    resolution: [
                        formData.camera.resolution_width,
                        formData.camera.resolution_height
                    ].join('x')
                },
                cloudwatch: {
                    ...formData.cloudwatch,
                },
                health: {
                    ...formData.health,
                }
            };
            for (let key in formData.camera) {
                if (key === 'loading' || key.match(/^recording_/) || key.match(/^resolution/)) {
                    continue;
                }
                payload.camera[key] = formData.camera[key];
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

    const inputChange = parent => event => {
        setFormData({
            ...formData,
            [parent]: {
                ...formData[parent],
                [event.currentTarget.name]: event.currentTarget.value,
            }
        });
    };

    return (
        <>
            <AccountBreadcrumb replace={{[cameraId]: cameraData.displayName }} />
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
                            <Accordion defaultActiveKey="camera">
                                <Accordion.Item eventKey="camera">
                                    <Accordion.Header><strong>Camera Configuration</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Form.Group as={Col}>
                                                <Form.Label>Buffer</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    disabled={formData.loading}
                                                    value={formData.camera.buffer}
                                                    required name="buffer"/>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Sensitivity</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    disabled={formData.loading}
                                                    value={formData.camera.sensitivity}
                                                    name="sensitivity"/>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Rotation</Form.Label>
                                                <Form.Select
                                                    disabled={formData.loading}
                                                    onChange={inputChange('camera')}
                                                    name="rotation"
                                                    value={formData.camera.rotation}>
                                                    {[0, 90, 180, 270].map((degree, index) => <option key={`degree-${index}`} value={degree}>{degree}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Framerate</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    disabled={formData.loading}
                                                    value={formData.camera.framerate}
                                                    required name="framerate"/>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Resolution Width</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    disabled={formData.loading}
                                                    value={formData.camera.resolution_width}
                                                    name="resolution_width"/>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Resolution Height</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    disabled={formData.loading}
                                                    value={formData.camera.resolution_height}
                                                    name="resolution_height"/>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col} controlId="recording_start">
                                                <Form.Label>Recording Window Start</Form.Label>
                                                <Form.Select
                                                    disabled={formData.loading}
                                                    onChange={inputChange('camera')}
                                                    name="recording_start"
                                                    value={formData.camera.recording_start}>
                                                    {Array(24).fill().map((num, index) => <option key={`start-${index}`} value={index}>{index}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Recording Window End</Form.Label>
                                                <Form.Select
                                                    disabled={formData.loading}
                                                    onChange={inputChange('camera')}
                                                    name="recording_end"
                                                    value={formData.camera.recording_end}>
                                                    {Array(24).fill().map((num, index) => <option key={`end-${index}`} value={index}>{index}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Profile</Form.Label>
                                                <Form.Select
                                                    onChange={inputChange('camera')}
                                                    name="encoding_profile"
                                                    disabled={formData.loading}
                                                    value={formData.camera.encoding_profile}>
                                                    {['baseline', 'main', 'extended', 'high', 'constrained'].map(profile => {
                                                        return <option key={`encoding-${profile}`} value={profile}>{profile}</option>
                                                    })}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Level</Form.Label>
                                                <Form.Select
                                                    onChange={inputChange('camera')}
                                                    disabled={formData.loading}
                                                    value={formData.camera.encoding_level}
                                                    name="encoding_level">
                                                    {LEVELS.map((level, index) => <option key={`level-${index}`} value={level}>{level}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Bitrate</Form.Label>
                                                <Form.Control
                                                    onChange={inputChange('camera')}
                                                    type="number"
                                                    step={1000}
                                                    disabled={formData.loading}
                                                    value={formData.camera.encoding_bitrate}
                                                    required name="encoding_bitrate"/>
                                            </Form.Group>
                                        </Row>
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="storage">
                                    <Accordion.Header><strong>Storage Configuration</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Form.Group as={Col}>
                                                <Form.Label>S3 Storage</Form.Label>
                                                <Form.Switch
                                                    id="s3-enabled"
                                                    label="Enabled"
                                                    disabled={formData.loading}
                                                    checked={formData.storage.enabled}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        storage: {
                                                            ...formData.storage,
                                                            enabled: e.target.checked
                                                        }
                                                    })}
                                                />
                                            </Form.Group>
                                        </Row>
                                        {formData.storage.enabled &&
                                            <>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Bucket Name</Form.Label>
                                                        <Form.Control
                                                            disabled={formData.loading}
                                                            name="bucket_name"
                                                            value={formData.storage.bucket_name}
                                                            onChange={inputChange('storage')}
                                                        />
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Video Prefix</Form.Label>
                                                        <Form.Control
                                                            disabled={formData.loading}
                                                            name="video_prefix"
                                                            value={formData.storage.video_prefix}
                                                            onChange={inputChange('storage')}
                                                        />
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Image Prefix</Form.Label>
                                                        <Form.Control
                                                            disabled={formData.loading}
                                                            name="image_prefix"
                                                            value={formData.storage.image_prefix}
                                                            onChange={inputChange('storage')}
                                                        />
                                                    </Form.Group>
                                                </Row>
                                            </>
                                        }
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="cloudwatch">
                                    <Accordion.Header><strong>Logging Configuration</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Form.Group as={Col}>
                                                <Form.Label>Log Level</Form.Label>
                                                <Form.Select
                                                    disabled={formData.loading}
                                                    onChange={inputChange('cloudwatch')}
                                                    value={formData.cloudwatch.log_level}
                                                    name="log_level"
                                                >
                                                    {LOG_LEVELS.map(level => <option key={`log-level-${level}`} value={level}>{level}</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Upload to CloudWatch</Form.Label>
                                                <Form.Switch
                                                    disabled={formData.loading}
                                                    checked={formData.cloudwatch.enabled}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        cloudwatch: {
                                                            ...formData.cloudwatch,
                                                            enabled: e.target.checked,
                                                        }
                                                    })}
                                                    id='cloudwatch-enabled'
                                                    label="Enabled"
                                                />
                                            </Form.Group>
                                        </Row>
                                        {formData.cloudwatch.enabled &&
                                            <>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Background Thread</Form.Label>
                                                        <Form.Switch
                                                            id="cloudwatch-threaded"
                                                            disabled={formData.loading}
                                                            label="Enabled"
                                                            checked={formData.cloudwatch.threaded}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                cloudwatch: {
                                                                    ...formData.cloudwatch,
                                                                    threaded: e.target.checked,
                                                                }
                                                            })}
                                                        />
                                                    </Form.Group>
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Delineate Stream</Form.Label>
                                                        <Form.Switch
                                                            id="cloudwatch-delineate_stream"
                                                            disabled={formData.loading}
                                                            label="Enabled"
                                                            checked={formData.cloudwatch.delineate_stream}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                cloudwatch: {
                                                                    ...formData.cloudwatch,
                                                                    delineate_stream: e.target.checked,
                                                                }
                                                            })}
                                                        />
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Log Group</Form.Label>
                                                        <Form.Control
                                                            disabled={formData.loading}
                                                            onChange={inputChange('cloudwatch')}
                                                            value={formData.cloudwatch.log_group_name}
                                                            name="log_group_name"
                                                        />
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Event Type</Form.Label>
                                                        <Form.Select
                                                            disabled={formData.loading}
                                                            onChange={inputChange('cloudwatch')}
                                                            value={formData.cloudwatch.event_type}
                                                            name="event_type"
                                                        >
                                                            <option value="logs">Logs</option>
                                                            <option value="emf">EMF</option>
                                                            <option value="all">All</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                    {formData.cloudwatch.event_type !== 'logs' &&
                                                        <Form.Group as={Col}>
                                                            <Form.Label>Namespace</Form.Label>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                name="metric_namespace"
                                                                onChange={inputChange('metric_namespace')}
                                                                value={formData.cloudwatch.metric_namespace}
                                                            />
                                                        </Form.Group>
                                                    }
                                                </Row>
                                            </>
                                        }
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="health">
                                    <Accordion.Header><strong>Health Configuration</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Form.Group as={Col}>
                                                <Form.Label>Interval (in seconds)</Form.Label>
                                                <Form.Control
                                                    disabled={formData.loading}
                                                    name="interval"
                                                    type="number"
                                                    step="60"
                                                    onChange={inputChange('health')}
                                                    value={formData.health.interval}
                                                />
                                            </Form.Group>
                                        </Row>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                            <Row className="mt-2">
                                <Col className="text-center">
                                    <CancelButton className="me-2" disabled={data.submitting}/>
                                    <Button className="me-2" as={Link} to={`/account/cameras/${cameraId}`} variant="outline-secondary">{icons.icon('pencil')} Edit</Button>
                                    <Button disabled={data.submitting || formData.loading} type="submit" variant="success">Update</Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
                <hr/>
            </Container>
            <MotionVideoList cameraId={cameraId}/>
        </>
    );
}

export default CameraConfiguration;