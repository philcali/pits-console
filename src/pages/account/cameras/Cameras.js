import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import CameraCard from "../../../components/cameras/CameraCard";
import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";

function Cameras() {
    const navigate = useNavigate();
    const [ modal, setModal ] = useState({
        visible: false,
        item: {}
    })

    const columns = [
        {
            label: 'Thing',
            format: (item) => item.thingName
        },
        {
            label: 'Display Name',
            format: (item) => item.displayName
        }
    ];

    const actions = [
        {
            icon: 'eye',
            onClick: item => {
                return () => {
                    setModal({
                        visible: true,
                        item
                    })
                }
            }
        },
        {
            icon: 'card-list',
            onClick: item => {
                return () => {
                    navigate(`/account/cameras/${item.thingName}/configuration`);
                }
            }
        }
    ];

    const handleModalClose = () => {
        setModal({
            ...modal,
            visible: false,
        });
    }

    return (
        <>
            <Modal size="lg" show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Viewing {modal.item.displayName}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <CameraCard thingName={modal.item.thingName}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="outline-secondary" as={Link} to={`/account/cameras/${modal.item.thingName}`}>{icons.icon('pencil')} Edit</Button>
                    <Button variant="primary" as={Link} to={`/account/cameras/${modal.item.thingName}/configuration`}>{icons.icon('card-list')} Configure</Button>
                </Modal.Footer>
            </Modal>
            <ResourceList
                resource="cameras"
                resourceTitle="Camera"
                resourceId="thingName"
                columns={columns}
                actions={actions}
            />
        </>
    );
}

export default Cameras;