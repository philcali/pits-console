import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import MotionVideo from "../../../components/cameras/MotionVideo";
import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";
import { pitsService } from "../../../lib/services";

function Videos() {
    const [ modal, setModal ] = useState({
        visible: false,
        item: {}
    });

    const columns = [
        {
            label: "Video",
            format: (item) => item.motionVideo
        },
        {
            label: 'Camera',
            format: (item) => {
                return <Link to={`/account/cameras/${item.thingName}/configuration`}>{item.thingName}</Link>
            }
        }
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

    const editLink = item => `/accounts/videos/${item.motionVideo}/cameras/${item.thingName}`;

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
                handleDelete={handleDelete}
                formatEdit={editLink}
                create={false}
                columns={columns}
                actions={actions}
            />
        </>
    )
}

export default Videos;