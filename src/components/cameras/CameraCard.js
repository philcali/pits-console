import { useEffect, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import { icons } from "../common/Icons";
import { pitsService } from "../../lib/services";
import { useAlerts } from "../notifications/AlertContext";
import logo from "../../logo2.png";

function CameraCard(props) {
    const alerts = useAlerts();
    const [ image, setImage ] = useState({
        url: logo,
        lastModified: '',
        loading: true,
        startLoading: true,
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
            <Card.Header {...cardHeader}><strong>{props.thingName}</strong></Card.Header>
            {!image.loading &&
            <Card.Img className="fluid" variant="top" src={image.url}/>
            }
            <Card.Body>
                {image.loading && <Spinner animation="border"/> }
                <Card.Text>
                    {!image.loading &&
                    <>
                        <strong>Last Modified</strong>: {image.lastModified ? new Date(image.lastModified).toLocaleString() : 'NA'}
                        <br/>
                        <Button className="mt-1" onClick={updateCameraImage} variant="success">{icons.icon('camera')} Refresh</Button>
                    </>
                    }
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

export default CameraCard;