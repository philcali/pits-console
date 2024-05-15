import { useEffect, useState } from "react";
import { Accordion, Button, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import CameraCard from "../../../components/cameras/CameraCard";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { icons } from "../../../components/common/Icons";
import { useAlerts } from "../../../components/notifications/AlertContext";
import MotionVideoList from "../../../components/videos/MotionVideoList";
import { pitsService } from "../../../lib/services";
import { settings } from "../../../lib/constants";

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
        desired: {
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
                region_name: settings.region,
            },
            dataplane: {
                enabled: false,
                endpoint_url: `https://${new URL(settings.dataEndpoint).hostname}`,
                region_name: settings.region,
            },
            health: {
                interval: 3600,
            },
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
                        desired:{
                            ...formData.desired,
                            storage:{
                                ...formData.desired.storage,
                                'bucket_name': storage.bucketName,
                                'video_prefix': storage.deviceVideoPrefix,
                                'image_prefix': storage.imagePrefix,
                            },
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
                'dataplane',
                'health',
            ]
            let states = [
                'reported',
                'desired',
            ]
            pitsService.cameras().resource(cameraId, 'configuration').list({'document': documents, 'state': states})
                .then(configuration => {
                    if (isMounted) {
                        const getNewData = state => {
                            let [ resolution_width, resolution_height ] = configuration[state].camera.resolution.split('x');
                            let [ recording_start, recording_end ] = configuration[state].camera.recording_window.split('-');
                            return {
                                camera: {
                                    ...configuration[state].camera,
                                    resolution_width,
                                    resolution_height,
                                    recording_start,
                                    recording_end,
                                },
                                storage: {
                                    ...(configuration[state].storage || formData.desired.storage),
                                },
                                cloudwatch: {
                                    ...(configuration[state].cloudwatch || formData.desired.cloudwatch),
                                },
                                dataplane: {
                                    ...(configuration[state].dataplane || formData.desired.dataplane),
                                },
                                health: {
                                    ...(configuration[state].health || formData.desired.health),
                                },
                            }
                        };

                        setFormData({
                            reported: getNewData('reported'),
                            desired: getNewData('desired'),
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
                        formData.desired.camera.recording_start,
                        formData.desired.camera.recording_end
                    ].join('-'),
                    resolution: [
                        formData.desired.camera.resolution_width,
                        formData.desired.camera.resolution_height
                    ].join('x')
                },
                storage: {
                    ...formData.desired.storage,
                },
                cloudwatch: {
                    ...formData.desired.cloudwatch,
                },
                dataplane: {
                    ...formData.desired.dataplane,
                },
                health: {
                    ...formData.desired.health,
                }
            };
            for (let key in formData.desired.camera) {
                if (key.match(/^recording_/) || key.match(/^resolution/)) {
                    continue;
                }
                payload.camera[key] = formData.desired.camera[key];
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
            desired: {
                ...formData.desired,
                [parent]: {
                    ...formData.desired[parent],
                    [event.currentTarget.name]: event.currentTarget.value,
                }
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
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.buffer}
                                                        required name="buffer"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.buffer}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Sensitivity</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.sensitivity}
                                                        name="sensitivity"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.sensitivity}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Rotation</Form.Label>
                                                <InputGroup>
                                                    <Form.Select
                                                        disabled={formData.loading}
                                                        onChange={inputChange('camera')}
                                                        name="rotation"
                                                        value={formData.desired.camera.rotation}>
                                                        {[0, 90, 180, 270].map((degree, index) => <option key={`degree-${index}`} value={degree}>{degree}</option>)}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.rotation}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Framerate</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.framerate}
                                                        required name="framerate"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.framerate}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Resolution Width</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.resolution_width}
                                                        name="resolution_width"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.resolution_width}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Resolution Height</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.resolution_height}
                                                        name="resolution_height"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.resolution_height}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col} controlId="recording_start">
                                                <Form.Label>Recording Window Start</Form.Label>
                                                <InputGroup>
                                                    <Form.Select
                                                        disabled={formData.loading}
                                                        onChange={inputChange('camera')}
                                                        name="recording_start"
                                                        value={formData.desired.camera.recording_start}>
                                                        {Array(24).fill().map((num, index) => <option key={`start-${index}`} value={index}>{index}</option>)}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.recording_start}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Recording Window End</Form.Label>
                                                <InputGroup>
                                                    <Form.Select
                                                        disabled={formData.loading}
                                                        onChange={inputChange('camera')}
                                                        name="recording_end"
                                                        value={formData.desired.camera.recording_end}>
                                                        {Array(24).fill().map((num, index) => <option key={`end-${index}`} value={index}>{index}</option>)}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.recording_end}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Profile</Form.Label>
                                                <InputGroup>
                                                    <Form.Select
                                                        onChange={inputChange('camera')}
                                                        name="encoding_profile"
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.encoding_profile}>
                                                        {['baseline', 'main', 'extended', 'high', 'constrained'].map(profile => {
                                                            return <option key={`encoding-${profile}`} value={profile}>{profile}</option>
                                                        })}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.encoding_profile}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Level</Form.Label>
                                                <InputGroup>
                                                    <Form.Select
                                                        onChange={inputChange('camera')}
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.encoding_level}
                                                        name="encoding_level">
                                                        {LEVELS.map((level, index) => <option key={`level-${index}`} value={level}>{level}</option>)}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.encoding_level}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                        </Row>
                                        <Row className="mt-3">
                                            <Form.Group as={Col}>
                                                <Form.Label>Encoding Bitrate</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        onChange={inputChange('camera')}
                                                        type="number"
                                                        step={1000}
                                                        disabled={formData.loading}
                                                        value={formData.desired.camera.encoding_bitrate}
                                                        required name="encoding_bitrate"/>
                                                    {formData.reported && formData.reported.camera &&
                                                        <InputGroup.Text>{formData.reported.camera.encoding_bitrate}</InputGroup.Text>
                                                    }
                                                </InputGroup>
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
                                                    checked={formData.desired.storage.enabled}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        desired: {
                                                            ...formData.desired,
                                                            storage: {
                                                                ...formData.desired.storage,
                                                                enabled: e.target.checked
                                                            }
                                                        }
                                                    })}
                                                />
                                            </Form.Group>
                                        </Row>
                                        {formData.desired.storage.enabled &&
                                            <>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Bucket Name</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                name="bucket_name"
                                                                value={formData.desired.storage.bucket_name}
                                                                onChange={inputChange('storage')}
                                                            />
                                                            {formData.reported && formData.reported.storage &&
                                                                <InputGroup.Text>{formData.reported.storage.bucket_name}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Video Prefix</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                name="video_prefix"
                                                                value={formData.desired.storage.video_prefix}
                                                                onChange={inputChange('storage')}
                                                            />
                                                            {formData.reported && formData.reported.storage &&
                                                                <InputGroup.Text>{formData.reported.storage.video_prefix}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Image Prefix</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                name="image_prefix"
                                                                value={formData.desired.storage.image_prefix}
                                                                onChange={inputChange('storage')}
                                                            />
                                                            {formData.reported && formData.reported.storage &&
                                                                <InputGroup.Text>{formData.reported.storage.image_prefix}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
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
                                                <InputGroup>
                                                    <Form.Select
                                                        disabled={formData.loading}
                                                        onChange={inputChange('cloudwatch')}
                                                        value={formData.desired.cloudwatch.log_level}
                                                        name="log_level"
                                                    >
                                                        {LOG_LEVELS.map(level => <option key={`log-level-${level}`} value={level}>{level}</option>)}
                                                    </Form.Select>
                                                    {formData.reported && formData.reported.cloudwatch &&
                                                        <InputGroup.Text>{formData.reported.cloudwatch.log_level}</InputGroup.Text>
                                                    }
                                                </InputGroup>
                                            </Form.Group>
                                            <Form.Group as={Col}>
                                                <Form.Label>Upload to CloudWatch</Form.Label>
                                                <Form.Switch
                                                    disabled={formData.loading}
                                                    checked={formData.desired.cloudwatch.enabled}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        desired: {
                                                            ...formData.desired,
                                                            cloudwatch: {
                                                                ...formData.desired.cloudwatch,
                                                                enabled: e.target.checked,
                                                            }
                                                        }
                                                    })}
                                                    id='cloudwatch-enabled'
                                                    label="Enabled"
                                                />
                                            </Form.Group>
                                        </Row>
                                        {formData.desired.cloudwatch.enabled &&
                                            <>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Background Thread</Form.Label>
                                                        <Form.Switch
                                                            id="cloudwatch-threaded"
                                                            disabled={formData.loading}
                                                            label="Enabled"
                                                            checked={formData.desired.cloudwatch.threaded}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                desired: {
                                                                    ...formData.desired,
                                                                    cloudwatch: {
                                                                        ...formData.desired.cloudwatch,
                                                                        threaded: e.target.checked,
                                                                    }
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
                                                            checked={formData.desired.cloudwatch.delineate_stream}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                desired: {
                                                                    ...formData.desired,
                                                                    cloudwatch: {
                                                                        ...formData.desired.cloudwatch,
                                                                        delineate_stream: e.target.checked,
                                                                    }
                                                                }
                                                            })}
                                                        />
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Log Group</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                onChange={inputChange('cloudwatch')}
                                                                value={formData.desired.cloudwatch.log_group_name}
                                                                name="log_group_name"
                                                            />
                                                            {formData.reported && formData.reported.cloudwatch &&
                                                                <InputGroup.Text>{formData.reported.cloudwatch.log_group_name}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>AWS Region</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                onChange={inputChange('cloudwatch')}
                                                                value={formData.desired.cloudwatch.region_name}
                                                                name="region_name"
                                                            />
                                                            {formData.reported && formData.reported.cloudwatch &&
                                                                <InputGroup.Text>{formData.reported.cloudwatch.region_name}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Event Type</Form.Label>
                                                        <InputGroup>
                                                            <Form.Select
                                                                disabled={formData.loading}
                                                                onChange={inputChange('cloudwatch')}
                                                                value={formData.desired.cloudwatch.event_type}
                                                                name="event_type"
                                                            >
                                                                <option value="logs">Logs</option>
                                                                <option value="emf">EMF</option>
                                                                <option value="all">All</option>
                                                            </Form.Select>
                                                            {formData.reported && formData.reported.cloudwatch &&
                                                                <InputGroup.Text>{formData.reported.cloudwatch.event_type}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                    {formData.desired.cloudwatch.event_type !== 'logs' &&
                                                        <Form.Group as={Col}>
                                                            <Form.Label>Namespace</Form.Label>
                                                            <InputGroup>
                                                                <Form.Control
                                                                    disabled={formData.loading}
                                                                    name="metric_namespace"
                                                                    onChange={inputChange('cloudwatch')}
                                                                    value={formData.desired.cloudwatch.metric_namespace}
                                                                />
                                                                {formData.reported && formData.reported.cloudwatch &&
                                                                    <InputGroup.Text>{formData.reported.cloudwatch.metric_namespace}</InputGroup.Text>
                                                                }
                                                            </InputGroup>
                                                        </Form.Group>
                                                    }
                                                </Row>
                                            </>
                                        }
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="dataplane">
                                    <Accordion.Header><strong>Data Plane Configuration</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <Row>
                                            <Form.Group as={Col}>
                                                <Form.Label>Connection</Form.Label>
                                                <Form.Switch
                                                    disabled={formData.loading}
                                                    checked={formData.desired.dataplane.enabled}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        desired: {
                                                            ...formData.desired,
                                                            dataplane: {
                                                                ...formData.desired.dataplane,
                                                                enabled: e.target.checked,
                                                            }
                                                        }
                                                    })}
                                                    id='dataplane-enabled'
                                                    label="Enabled"
                                                />
                                            </Form.Group>
                                        </Row>
                                        {formData.desired.dataplane.enabled &&
                                            <>
                                                <Row>
                                                    <Form.Group as={Col}>
                                                        <Form.Label>Endpoint</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                name="endpoint_url"
                                                                onChange={inputChange('dataplane')}
                                                                value={formData.desired.dataplane.endpoint_url}
                                                            />
                                                            {formData.reported && formData.reported.dataplane &&
                                                                <InputGroup.Text>{formData.reported.dataplane.endpoint_url}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Form.Group as={Col}>
                                                        <Form.Label>AWS Region</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control
                                                                disabled={formData.loading}
                                                                onChange={inputChange('dataplane')}
                                                                value={formData.desired.dataplane.region_name}
                                                                name="region_name"
                                                            />
                                                            {formData.reported && formData.reported.dataplane &&
                                                                <InputGroup.Text>{formData.reported.dataplane.region_name}</InputGroup.Text>
                                                            }
                                                        </InputGroup>
                                                    </Form.Group>
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
                                                <InputGroup>
                                                    <Form.Control
                                                        disabled={formData.loading}
                                                        name="interval"
                                                        type="number"
                                                        step="60"
                                                        onChange={inputChange('health')}
                                                        value={formData.desired.health.interval}
                                                    />
                                                    {formData.reported && formData.reported.health &&
                                                        <InputGroup.Text>{formData.reported.health.interval}</InputGroup.Text>
                                                    }
                                                </InputGroup>
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