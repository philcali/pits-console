import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import MotionVideo from "../../../components/cameras/MotionVideo";
import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatDuration, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";

function Videos() {
    const [ modal, setModal ] = useState({
        visible: false,
        item: {}
    });

    const [ cameras, setCameras ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (cameras.loading) {
            pitsService.cameras().list({ nextToken: cameras.nextToken }).then(resp => {
                if (isMounted) {
                    setCameras({
                        ...cameras,
                        items: cameras.items.concat(resp.items),
                        nextToken: resp.nextToken,
                        loading: resp.nextToken !== null
                    });
                }
            });
        }
        return () => {
            isMounted = false;
        };
    });

    const thingToDisplay = {};
    cameras.items.forEach(camera => thingToDisplay[camera.thingName] = camera.displayName);

    const columns = [
        {
            label: 'Camera',
            format: (item) => {
                return <Link to={`/account/cameras/${item.thingName}/configuration`}>{thingToDisplay[item.thingName] || item.thingName}</Link>
            }
        },
        {
            label: "Duration",
            format: (item) => formatDuration(item.duration)
        },
    ];

    const actions = [
        {
            icon: 'eye',
            onClick: item => {
                return () => {
                    setModal({
                        visible: true,
                        loading: true,
                        item
                    });
                };
            }
        }
    ];

    const handleDelete = (item, onSuccess, onComplete) => {
        pitsService.videos().resource(item.motionVideo, 'cameras')
            .delete(item.thingName)
            .then(onSuccess)
            .finally(onComplete);
    };

    const handleModalClose = () => {
        setModal({
            ...modal,
            visible: false,
        });
    }

    const editLink = item => `/account/videos/${item.motionVideo}/cameras/${item.thingName}`;

    const searchParams = [
        {
            'name': 'startTime',
            'label': 'After',
            'type': 'date',
        },
        {
            'name': 'endTime',
            'label': 'Before',
            'type': 'date'
        },
        {
            'name': 'cameraId',
            'label': 'Camera',
            'as': ({value, disabled, onChange}) => {
                return (
                    <Form.Select name="cameraId" defaultValue={value} onChange={onChange} disabled={disabled || cameras.loading}>
                        <option value="">All</option>
                        {cameras.items.map(camera => {
                            return <option key={`camera-${camera.thingName}`} value={camera.thingName}>{camera.displayName}</option>
                        })}
                    </Form.Select>
                );
            },
            'resource': (resource, value) => {
                return value === '' ? resource : pitsService.cameras().resource(value, 'videos');
            }
        }
    ];

    return (
        <>
            <Modal size="lg" show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Viewing {modal.item.motionVideo}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <MotionVideo
                        thingName={modal.item.thingName}
                        motionVideo={modal.item.motionVideo}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="outline-secondary" as={Link} to={`/account/videos/${modal.item.motionVideo}/cameras/${modal.item.thingName}`}>{icons.icon('pencil')} Edit</Button>
                </Modal.Footer>
            </Modal>
            <ResourceList
                resource="videos"
                resourceTitle="Motion Video"
                resourceId="motionVideo"
                searchParams={searchParams}
                handleDelete={handleDelete}
                formatEdit={editLink}
                formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
                pagination={10}
                manuallyPage={true}
                create={false}
                columns={columns}
                actions={actions}
            />
        </>
    )
}

export default Videos;