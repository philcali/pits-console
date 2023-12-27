import { useEffect, useState } from "react";
import { Badge, Button, Container, Form, Modal, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { icons } from "../../../components/common/Icons";
import { useAlerts } from "../../../components/notifications/AlertContext";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";

const JOB_TYPES = [ "Update", "Reboot" ]

function TargetSelect({ resourceId, resourceLabel, onChange, name, value }) {
    const resource = useResource();

    return (
        <Form.Select disabled={resource.loading} onChange={onChange} name={name} value={value}>
            <option>Select from {resource.name}</option>
            {resource.items.map(item => {
                return <option key={item[resourceId]} value={item[resourceId]}>{item[resourceLabel || resourceId]}</option>
            })}
        </Form.Select>
    )
}

function JobExecutionTable({ jobId }) {
    const camera = useResource();
    const resource = pitsService.jobs().resource(jobId, 'executions');
    const thingDisplayName = {};
    camera.items.forEach(item => {
        thingDisplayName[item.thingName] = item.displayName
    });
    const columns = [
        {
            label: 'Camera',
            format: (item) => {
                return <Link to={`/account/cameras/${item.thingName}/configuration`}>{thingDisplayName[item.thingName]}</Link>
            }
        },
        {
            label: 'Status',
            format: (item) => {
                return <Badge bg={getStatusColor(item.status)}>{item.status}</Badge>
            }
        },
        {
            label: 'Started At',
            centered: true,
            format: (item) => {
                return `${formatDate(item.startedAt)} ${formatTime(item.startedAt)}`;
            }
        }
    ];
    return (
        <ResourceList
            resource={resource}
            resourceTitle="Execution"
            resourceId="thingName"
            hideSearchText={true}
            create={false}
            createTimeField='queuedAt'
            formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
            disableMutate={true}
            columns={columns}
        />
    )
}

function getStatusColor(status) {
    switch (status) {
        case 'COMPLETED':
        case 'SUCCEEDED':
            return 'success';
        case 'FAILED':
        case 'CANCELED':
            return 'danger';
        case 'IN_PROGRESS':
            return 'info';
        default:
            return 'primary';
    }
}

function JobMutate() {
    const alerts = useAlerts();
    const navigate = useNavigate();
    const { jobId } = useParams();
    const create = jobId === 'new';
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });

    const [ modal, setModal ] = useState({
        visible: false,
        type: '',
        targetId: ''
    });

    const [ content, setContent ] = useState({
        id: jobId,
        loading: !create
    });

    const [ formData, setFormData ] = useState({
        type: 'update',
        description: '',
        cameras: [],
        groups: []
    });

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.jobs().get(jobId)
                .then(existing => {
                    if (isMounted) {
                        setFormData({
                            ...existing,
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load ${jobId}: ${e.message}`);
                })
                .finally(() => {
                    if (isMounted) {
                        setContent({
                            ...content,
                            loading: false
                        });
                    }
                });
        }
        return () => {
            isMounted = false;
        }
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
            const action = create ?
                pitsService.jobs().create(formData) :
                pitsService.jobs().update(jobId, formData);
            action
                .then(resp => {
                    alerts.success(`Successfully ${create ? 'created' : 'updated'} ${resp.jobId}`);
                    navigate(`/account/jobs/${resp.jobId}`);
                })
                .catch(e => {
                    alerts.error(`Failed to ${create ? 'create' : 'update'} job: ${e}`)
                });
        }
    };

    const inputChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    const modalInputChange = event => {
        setModal({
            ...modal,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    const disabled = data.submitting;

    const toggleModal = visible => {
        return () => setModal({...modal, type: '', targetId: '', visible});
    };

    const submitTarget = () => {
        formData[modal.type].push(modal.targetId);
        setFormData({
            ...formData,
            [modal.type]: formData[modal.type]
        });
        toggleModal(false)();
    };

    const removeTarget = (target, index) => {
        return () => {
            formData[target].splice(index, 1);
            setFormData({
                ...formData,
                [target]: formData[target]
            });
        }
    }

    return (
        <>
            <AccountBreadcrumb/>
            <Modal size="lg" show={modal.visible} onHide={toggleModal(false)}>
                <Modal.Header closeButton>
                    Add Target
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="type">
                            <Form.Label>Target Type</Form.Label>
                            <Form.Select name="type" onChange={modalInputChange} value={modal.type}>
                                <option>Select a Type</option>
                                <option value="cameras">Camera</option>
                                <option value="groups">Group</option>
                            </Form.Select>
                        </Form.Group>
                        {modal.type !== '' &&
                            <ProvideResource resource={modal.type}>
                                <TargetSelect
                                    resourceId={modal.type === 'cameras' ? 'thingName' : 'name'}
                                    value={modal.targetId}
                                    name="targetId"
                                    onChange={modalInputChange}
                                />
                            </ProvideResource>
                        }
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={toggleModal(false)} variant="outline-secondary">Cancel</Button>
                    <Button disabled={modal.targetId === '' || modal.type === ''} onClick={submitTarget} variant="success">Submit</Button>
                </Modal.Footer>
            </Modal>
            <Container>
                <Header>
                    {create ? 'Create Job' : `Update Job ${jobId}`}
                </Header>
                
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    {create &&
                        <>
                            <Form.Group className="mb-3">
                                <Table responsive>
                                    <thead>
                                        <tr>
                                            <th>Target</th>
                                            <th>Name</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Cameras', 'Groups'].flatMap(target => {
                                            console.log(formData[target.toLowerCase()])
                                            return formData[target.toLowerCase()].map((name, index) => {
                                                return (
                                                    <tr key={`${target}-${name}`}>
                                                        <td>{target}</td>
                                                        <td><Badge bg="success">{name}</Badge></td>
                                                        <td>
                                                            <Button
                                                                onClick={removeTarget(target.toLowerCase(), index)}
                                                                size="sm"
                                                                variant="danger">{icons.icon('trash')}</Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="text-center">
                                                <Button onClick={toggleModal(true)} variant="success">{icons.icon('plus')} Add Target</Button>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Form.Group>
                        </>
                    }
                    {(!create && formData.status) &&
                        <>
                            <Form.Group className="mb-3" controlId="status">
                                <Form.Label>Status</Form.Label>
                                <br/>
                                <Badge bg={getStatusColor(formData.status)}>{formData.status}</Badge>
                            </Form.Group>
                        </>
                    }
                    <Form.Group className="mb-3" controlId="type">
                        <Form.Label>Type</Form.Label>
                        <Form.Select disabled={disabled || !create} name="type" required onChange={inputChange} value={formData.type}>
                            {JOB_TYPES.map((type, index) => <option key={`type-${index}`} value={type.toLowerCase()}>{type}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            disabled={disabled}
                            name="description"
                            value={formData.description}
                            onChange={inputChange}
                            as='textarea'
                        />
                    </Form.Group>
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
                {!create && <hr/>}
            </Container>
            {!create && 
                <>
                    <ProvideResource resource="cameras">
                        <JobExecutionTable jobId={jobId}/>
                    </ProvideResource>
                </>
            }
        </>
    )
}

export default JobMutate;