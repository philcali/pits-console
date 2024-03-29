import { useEffect, useState } from "react";
import { Button, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import { formatDate, formatDuration, formatTime } from "../../lib/format";
import { pitsService } from "../../lib/services";
import MotionVideo from "../cameras/MotionVideo";
import { icons } from "../common/Icons";
import ResourceList from "../resource/ResourceList";
import TagControl from "./TagControl";
import logo from "../../logo2.png";

function SearchResource(props) {
    let [ resource, setResource ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });
    if (props.existing) {
        resource = {...props.existing, loading: false};
        setResource = () => {};
    }

    useEffect(() => {
        let isMounted = true;
        if (resource.loading) {
            pitsService[props.resource]().list({ nextToken: resource.nextToken }).then(resp => {
                if (isMounted) {
                    setResource({
                        ...resource,
                        items: resource.items.concat(resp.items),
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

    return (
        <Form.Select name={props.name} defaultValue={props.value} onChange={props.onChange} disabled={props.disabled || resource.loading}>
            <option value="">{props.unsetLabel}</option>
            {resource.items.map((item, index) => {
                return <option key={`${props.resource}-${index}`} value={item[props.resourceId]}>{item[props.resourceDisplay]}</option>
            })}
        </Form.Select>
    );
}

function MotionVideoList(props) {
    let resource = 'videos';
    let additionalParams = {};
    ['cameras', 'tags'].forEach(name => {
        let id = name.substring(0, name.length - 1) + 'Id';
        if (id in props) {
            resource = pitsService[name]().resource(props[id], resource);
            additionalParams[id] = props[id];
        }
    });
    const [ modal, setModal ] = useState({
        visible: false,
        associateVisible: false,
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

    const thingDisplayName = {};
    cameras.items.forEach(item => {
        thingDisplayName[item.thingName] = item.displayName;
    });

    const columns = [
        {
            label: 'Thumbnail',
            format: item => {
                let image = logo;
                if (item.thumbnail) {
                    image = `data:image/jpeg;base64, ${item.thumbnail}`;
                }
                return <img width={120} src={image} alt="Motion Thumbnail" />
            }
        },
        {
            label: 'Camera',
            format: (item) => {
                return <Link to={`/account/cameras/${item.thingName}/configuration`}>{thingDisplayName[item.thingName] || item.thingName}</Link>
            }
        },
        {
            label: 'Trigger',
            centered: true,
            format: item => {
                let icon = icons.icon('person-walking', 20);
                let source = 'motion'
                if (item.trigger && item.trigger !== 'motion') {
                    icon = icons.icon('person-standing');
                    source = item.trigger;
                }
                const renderTooltip = props => {
                    return (
                        <Tooltip {...props} id={`${item.motionVideo}.trigger`}>
                            Triggered by {source} action.
                        </Tooltip>
                    )   
                }
                return (
                    <OverlayTrigger
                        placement="right"
                        overlay={renderTooltip}
                    >
                        <span>{icon}</span>
                    </OverlayTrigger>
                )
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
                        associateVisible: false,
                        item
                    });
                };
            }
        },
        {
            icon: 'tag',
            onClick: item => {
                return () => {
                    setModal({
                        visible: false,
                        associateVisible: true,
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
            associateVisible: false,
        });
    }

    const editLink = item => `/account/videos/${item.motionVideo}/cameras/${item.thingName}`;
    const searchParams = [
        {
            'name': 'startTime',
            'label': 'After',
            'type': 'datetime-local',
        },
        {
            'name': 'endTime',
            'label': 'Before',
            'type': 'datetime-local'
        },
        {
            'name': 'cameraId',
            'label': 'Camera',
            'as': ({value, disabled, onChange}) => {
                return <SearchResource
                    unsetLabel="All"
                    name="cameraId"
                    resource="cameras"
                    resourceId="thingName"
                    existing={cameras}
                    resourceDisplay="displayName"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            },
            'resource': (value) => {
                return value === '' ? false : pitsService.cameras().resource(value, 'videos');
            },
            'disabledIfSet': 'tagId',
            'hideIfSet': ['cameraId', 'tagId']
        },
        {
            'name': 'tagId',
            'label': 'Tag',
            'as': ({value, disabled, onChange}) => {
                return <SearchResource
                    unsetLabel="Any"
                    name="tagId"
                    resource="tags"
                    resourceId="name"
                    resourceDisplay="name"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            },
            'resource': (value) => {
                return value === '' ? false : pitsService.tags().resource(value, 'videos');
            },
            'disabledIfSet': 'cameraId',
            'hideIfSet': ['cameraId', 'tagId']
        }
    ];

    return (
        <>
            <Modal size="lg" show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Viewing {modal.item.motionVideo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <MotionVideo
                        thingName={modal.item.thingName}
                        motionVideo={modal.item.motionVideo}
                    />
                    <hr/>
                    <TagControl video={modal.item}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="outline-secondary" as={Link} to={`/account/videos/${modal.item.motionVideo}/cameras/${modal.item.thingName}`}>{icons.icon('pencil')} Edit</Button>
                </Modal.Footer>
            </Modal>
            <Modal size="lg" show={modal.associateVisible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Tag {modal.item.motionVideo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TagControl video={modal.item}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Close</Button>
                </Modal.Footer>
            </Modal>
            <ResourceList
                resource={resource}
                resourceTitle="Motion Video"
                resourceId="motionVideo"
                searchParams={searchParams}
                additionalParams={additionalParams}
                handleDelete={handleDelete}
                formatEdit={editLink}
                formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
                hideSearchText={true}
                pagination={10}
                manuallyPage={true}
                create={false}
                columns={columns}
                actions={actions}
            />
        </>
    )
}

export default MotionVideoList;