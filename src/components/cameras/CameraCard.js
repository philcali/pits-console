import React, { useEffect, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { icons } from "../common/Icons";
import { pitsService } from "../../lib/services";
import { useAlerts } from "../notifications/AlertContext";
import logo from "../../logo2.png";
import CameraHealthBadge from "./CameraHealthBadge";
import { settings } from "../../lib/constants";
import { siteSessions } from "../../lib/session";
import { useConnection } from "../connection/ConnectionContext";
import jsmpeg from "jsmpeg";


function LiveRecording(props) {
    const canvas = React.createRef();
    const connection = useConnection();

    useEffect(() => {
        const ctx = canvas.current.getContext('2d');
        ctx.fillStyle = '#444';
        ctx.fillText('Loading...',
            canvas.current.width / 2 - 30,
            canvas.current.height / 3
        );
        const session = new WebSocket(settings.dataEndpoint + '?' + [
            'Authorization=' + encodeURIComponent(siteSessions.sessionToken()),
            'ManagerId=' + encodeURIComponent(connection.manager.connectionId),
        ].join('&'), 'session');
        const existingMethod = jsmpeg.prototype.receiveSocketMessage;
        jsmpeg.prototype.receiveSocketMessage = function(event) {
            // Note that this is horribly inefficient, but necessary due to
            // API Gateway's "binary conversion" policies. Even the management
            // API appears to encode the raw video binary into utf8 or some
            // ascii format (likely because the WebSocket message sent to a connection
            // is a OpCode text message). Rather than mucking about the internals
            // of API GW, the device encodes the raw video binary into base64, decoded
            // here, and converted to an unsigned integer array, which is then
            // compatible with jsmpeg encoder. This leads to noticeable blips
            // in the video stream, but it is at least functional.
            existingMethod.bind(this)({
                data: Uint8Array.from(atob(event.data), c => c.charCodeAt(0))
            });
        };
        const player = new jsmpeg(session, {canvas: canvas.current});

        const onConnect = resp => {
            switch (resp.action) {
                case '$connect':
                    const sessionId = resp.body.connectionId;
                    connection.manager.invoke({
                        connectionId: sessionId,
                        camera: props.thingName,
                        event: {
                            name: 'record',
                            session: {
                                start: true,
                            }
                        },
                    });
                    break;
                default:
                    break;
            }
        }
        connection.manager.onRequest(onConnect);

        return () => {
            connection.manager.offRequest(onConnect);
            player.stop();
            jsmpeg.prototype.receiveSocketMessage = existingMethod;
        };
    }, []);

    return <canvas
        ref={canvas}
        width={props.configuration.width}
        height={props.configuration.height}
    />
}


function Recording(props) {
    const alerts = useAlerts();
    let [ configuration, setConfiguration ] = useState({
        loading: true
    })

    useEffect(() => {
        if (configuration.loading) {
            pitsService.cameras().resource(props.thingName, 'configuration').list()
                .then(data => {
                    setConfiguration({
                        ...data,
                        loading: false,
                    });
                })
                .catch(error => {
                    alerts.error(`Failed to load configuration: ${error.message}`);
                    setConfiguration({
                        ...configuration,
                        loading: false,
                    });
                })
        }
    });

    return (
        <>
            {configuration.loading && <Spinner animation="border" size="lg"/>}
            {!configuration.loading &&
                <LiveRecording {...props} configuration={configuration} />
            }
        </>
    )
}

function CameraCard(props) {
    const alerts = useAlerts();
    const [ image, setImage ] = useState({
        url: logo,
        lastModified: '',
        loading: true,
        startLoading: true,
        startVideoCapture: false,
        startRecording: false,
        capableOfRecording: false,
    });

    const updateCameraImage = event => {
        setImage({
            ...image,
            loading: true
        });
        pitsService.imageCapture(props.thingName)
            .then(image => {
                setImage({
                    ...image,
                    loading: false
                });
            })
            .catch(error => {
                alerts.error(error);
                setImage({
                    ...image,
                    loading: false
                });
            })
    };

    const startCaptureVideo = () => {
        setImage({
            ...image,
            startVideoCapture: true
        });
        pitsService.startVideoCapture(props.thingName)
            .then(resp => resp.json())
            .then(capture => {
                alerts.success(`Successfully sent event to capture video for ${props.displayName || props.thingName}`);
            })
            .catch(e => {
                alerts.error(`Failed to send event to capture video for ${props.displayName || props.thingName}: ${e.message}`);
            })
            .finally(() => {
                setImage({
                    ...image,
                    startVideoCapture: false,
                })
            });
    }

    const startRecording = () => {
        setImage({
            ...image,
            startRecording: true,
        })
    }

    const stopRecording = () => {
        setImage({
            ...image,
            startRecording: false,
        })
    };

    useEffect(() => {
        let isMounted = true;
        if (image.startLoading) {
            pitsService.getImageCaptureMetadata(props.thingName)
                .then(resp => resp.json())
                .then(async metadata => {
                    if (isMounted) {
                        if (!metadata.id) {
                            setImage({
                                ...image,
                                startLoading: false,
                                loading: false
                            })
                        } else {
                            const result = await pitsService.getImageCaptureUrl(props.thingName);
                            setImage({
                                ...result,
                                ...metadata,
                                startLoading: false,
                                loading: false
                            })
                        }
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    });

    const cardHeader = {};
    if (props.onClick) {
        cardHeader['onClick'] = props.onClick;
    }
    const variant = props.variant || 'light';
    return (
        <Card bg={variant} text={variant === 'light' ? 'dark' : 'white'}>
            <Card.Header {...cardHeader}>
                <strong className="ms-6">{props.displayName || props.thingName}</strong>
                <CameraHealthBadge latestVersion={props.latestVersion} thingName={props.thingName} />
            </Card.Header>
            {!image.loading && !image.startRecording &&
                <Card.Img className="fluid" variant="top" src={image.url}/>
            }
            {image.startRecording &&
                <Recording {...props} />
            }
            <Card.Body>
                {image.loading && <Spinner animation="border"/> }
                <Card.Text>
                    {!image.loading &&
                    <>
                        <strong>Last Modified</strong>: {image.lastModified ? new Date(image.lastModified).toLocaleString() : 'NA'}
                        <br/>
                        <Button className="mt-1" onClick={updateCameraImage} variant="success">{icons.icon('camera')} Refresh</Button>
                        {' '}
                        <Button disabled={image.startVideoCapture} className="mt-1" onClick={startCaptureVideo} variant="secondary">{image.startVideoCapture ? <Spinner size="sm" animation="border"/> : icons.icon('record-btn')} Record</Button>
                        {' '}
                        {!image.startRecording &&
                            <Button className="mt-1" onClick={startRecording} variant="danger">{image.startVideoCapture ? <Spinner size="sm" animation="border"/> : icons.icon('record-btn')} Live</Button>
                        }
                        {image.startRecording &&
                            <Button className="mt-1" onClick={stopRecording} variant="danger">{image.startVideoCapture ? <Spinner size="sm" animation="border"/> : icons.icon('record-btn')} Stop</Button>
                        }
                    </>
                    }
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

export default CameraCard;