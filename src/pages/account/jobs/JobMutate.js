import { useEffect, useState } from "react";
import { Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { icons } from "../../../components/common/Icons";
import { useAlerts } from "../../../components/notifications/AlertContext";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime, parseSearchParams } from "../../../lib/format";
import { pitsService } from "../../../lib/services";
import { JobCancelationModal } from "./Jobs";


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

function JobTypeSelect(props) {
    const resource = useResource();
    const jobType = resource.items.find(item => item.name === props.value);

    const onParameterChange = param => event => {
        props.onParameterChange(param, event.target.value);
    };

    return (
        <>
            <Form.Group className="mb-3" controlId="type">
                <Form.Label>Type</Form.Label>
                <Row>
                    <Col>
                        <Form.Select {...props} disabled={props.disabled || resource.loading}>
                            {resource.items.map(item => <option key={`type-${item.name}`} value={item.name}>{item.name}</option>)}
                        </Form.Select>
                    </Col>
                {jobType && 
                    <Col>
                        <strong>Description:</strong> {jobType.description}
                        <br/>
                        <strong>Version:</strong> {jobType.version}
                    </Col>
                }
                </Row>
            </Form.Group>
            {(jobType?.parameters || []).map(param => {
                return (
                    <Form.Group className="mb-3" controlId={`parameters-${param}`}>
                        <Form.Label>Parameter: <Badge pill>{param}</Badge></Form.Label>
                        <Form.Control disabled={props.disabled} value={props.parameters[param] || ''} onChange={onParameterChange(param)} type="input"></Form.Control>
                    </Form.Group>
                );
            })}
        </>
    );
}

function JobExecutionTable({ jobId }) {
    const alerts = useAlerts();
    const camera = useResource();
    const resource = pitsService.jobs().resource(jobId, 'executions');
    const thingDisplayName = {};
    camera.items.forEach(item => {
        thingDisplayName[item.thingName] = item.displayName
    });

    const [ modal, setModal ] = useState({
        detailsShow: false,
        deleteShow: false,
        cancelShow: false,
        detailsLoading: false,
        deleteLoading: false,
        cancelLoading: false,
        execution: {},
    });

    useEffect(() => {
        if (modal.detailsLoading) {
            pitsService.jobs()
                .resource(jobId, 'executions')
                .get(modal.execution.thingName, { executionId: modal.execution.executionNumber })
                .then(detailedExecution => {
                    setModal({
                        ...modal,
                        execution: detailedExecution,
                        detailsLoading: false,
                    })
                })
                .catch(e => {
                    alerts.error(`Failed to load ${jobId} for ${modal.execution.thingsName}: ${e.message}`);
                    setModal({
                        ...modal,
                        detailsLoading: false,
                    })
                })
        }

        if (modal.cancelLoading) {
            pitsService.jobs()
                .resource(jobId, 'executions')
                .resource(modal.execution.thingName, 'cancel')
                .create({ force: true })
                .then(() => {
                    alerts.success(`Successfully canceled ${jobId} for ${thingDisplayName[modal.execution.thingName]}`);
                    setModal({
                        ...modal,
                        cancelShow: false,
                        cancelLoading: false,
                    })
                })
                .catch(e => {
                    alerts.error(`Failed to cancel ${jobId} for ${modal.execution.thingName}: ${e.message}`);
                    setModal({
                        ...modal,
                        cancelLoading: false,
                    })
                })
        }

        if (modal.deleteLoading) {
            pitsService.jobs()
                .resource(jobId, 'executions')
                .resource(modal.execution.thingName, 'number')
                .delete(modal.execution.executionNumber)
                .then(() => {
                    alerts.success(`Successfully deleted ${jobId} for ${thingDisplayName[modal.execution.thingName]}`);
                    setModal({
                        ...modal,
                        deleteLoading: false,
                        deleteShow: false,
                    })
                })
                .catch(e => {
                    alerts.error(`Failed to delete ${jobId} for ${thingDisplayName[modal.execution.thingName]}: ${e.message}`);
                    setModal({
                        ...modal,
                        deleteLoading: false,
                    })
                })
        }
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
            label: 'Execution Number',
            format: item => {
                return item.executionNumber;
            }
        },
        {
            label: 'Started At',
            centered: true,
            format: (item) => {
                if (!item.startedAt) {
                    return 'NA';
                }
                return `${formatDate(item.startedAt)} ${formatTime(item.startedAt)}`;
            }
        }
    ];

    const isCancelable = execution => {
        return ['QUEUED', 'IN_PROGRESS'].indexOf(execution.status) !== -1;
    }

    const cancelJobExecution = () => {
        setModal({
            ...modal,
            cancelLoading: true,
        })
    };

    const deleteJobExecution = () => {
        setModal({
            ...modal,
            deleteLoading: true,
        })
    }

    const actions = [
        {
            icon: 'eye',
            variant: 'outline-secondary',
            onClick: execution => {
                return () => {
                    setModal({
                        ...modal,
                        execution,
                        detailsShow: true,
                        detailsLoading: true,
                    })
                }
            }
        },
        {
            icon: 'stop-circle',
            variant: 'outline-danger',
            filter: isCancelable,
            onClick: execution => {
                return () => {
                    setModal({
                        ...modal,
                        execution,
                        cancelShow: true,
                    })
                }
            }
        },
        {
            icon: 'trash',
            variant: 'danger',
            onClick: execution => {
                return () => {
                    setModal({
                        ...modal,
                        execution,
                        deleteShow: true,
                    })
                }
            }
        }
    ];

    return (
        <>
            <Modal size="lg" show={modal.deleteShow} onHide={() => setModal({...modal, deleteShow: false})}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Delete {thingDisplayName[modal.execution.thingName]} execution number {modal.execution.executionNumber}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to delete job <strong>execution number {modal.execution.executionNumber}</strong> for <strong>{thingDisplayName[modal.execution.thingName]}</strong>?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => setModal({...modal, deleteShow: false})} variant="outline-secondary">Close</Button>
                    <Button disabled={modal.deleteLoading} onClick={deleteJobExecution} variant="danger">Delete</Button>
                </Modal.Footer>
            </Modal>

            <Modal size="lg" show={modal.cancelShow} onHide={() => setModal({...modal, cancelShow: false})}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Cancel execution {modal.execution.executionNumber} for {thingDisplayName[modal.execution.thingName]}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to cancel job <strong>execution number {modal.execution.executionNumber}</strong> for <strong>{thingDisplayName[modal.execution.thingName]}</strong>?
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setModal({...modal, cancelShow: false})}>Close</Button>
                    <Button disabled={modal.cancelLoading} onClick={cancelJobExecution} variant="danger">Cancel</Button>
                </Modal.Footer>
            </Modal>

            <Modal size="lg" show={modal.detailsShow} onHide={() => setModal({...modal, detailsShow: false})}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Details for {thingDisplayName[modal.execution.thingName]} execution {modal.execution.executionNumber}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col><strong>Status</strong></Col>
                        <Col><Badge bg={getStatusColor(modal.execution.status)}>{modal.execution.status}</Badge></Col>
                    </Row>
                    <Row className="mt-2">
                        {modal.detailsLoading && <Col className="text-center"><Spinner size="lg" animation="border"/></Col>}
                        {!modal.detailsLoading && modal.execution?.statusDetails?.detailsMap &&
                            <Table className="ms-1" borderless responsive>
                                <tbody>
                                    <tr>
                                        <td><strong>Reason</strong></td>
                                        <td>{modal.execution.statusDetails.detailsMap.reason}</td>
                                    </tr>
                                    <tr colSpan={2}>
                                        <td><strong>Stdout</strong> <code>&gt;</code></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2}>
                                            <pre
                                                className="ps-2 pt-2 pb-2"
                                                style={{ border: '1px solid #ddd', backgroundColor: 'black', color: 'white'}}>{modal.execution.statusDetails.detailsMap.stdout}</pre>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        }
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setModal({...modal, detailsShow: false})}>Close</Button>
                </Modal.Footer>
            </Modal>

            {!modal.cancelLoading && !modal.deleteLoading &&
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
                    actions={actions}
                />
            }
        </>
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
    const location = useLocation();
    const queryParams = parseSearchParams(location.search.replace('?', ''));
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

    const [ cancelModal, setCancelModal ] = useState({
        show: false,
        jobLoading: false,
        job: {}
    })

    const [ content, setContent ] = useState({
        id: jobId,
        loading: !create
    });

    const [ formData, setFormData ] = useState({
        type: queryParams['type'] || 'update',
        description: '',
        cameras: queryParams['targetType'] === 'cameras' && queryParams['targetId'] ? [ queryParams['targetId'] ] : [],
        groups: queryParams['targetType'] === 'groups' && queryParams['targetId'] ? [ queryParams['targetId'] ] : [],
        parameters: {
            'user': 'root',
            'service': 'pinthesky',
            'lines': 20,
            ...(queryParams || {}),
        },
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
                })
                .finally(() => {
                    setData({
                        ...data,
                        submitting: false,
                    })
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
            <JobCancelationModal
                show={cancelModal.show}
                onHide={() => setCancelModal({...cancelModal, show: false})}
                job={formData}
                jobLoading={false}
                onCancel={({starting}) => {
                    if (!starting) {
                        setContent({
                            ...content,
                            loading: true
                        })
                    }
                }}
            />
            <AccountBreadcrumb/>
            <Modal size="lg" show={modal.visible} onHide={toggleModal(false)}>
                <Modal.Header closeButton>
                    Add Target
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="type">
                            <Form.Label>Target Type</Form.Label>
                            <Form.Select disabled={modal.type !== ''} name="type" onChange={modalInputChange} value={modal.type}>
                                <option>Select a Type</option>
                                <option value="cameras">Camera</option>
                                <option value="groups">Group</option>
                            </Form.Select>
                        </Form.Group>
                        {modal.type !== '' &&
                            <ProvideResource resource={modal.type}>
                                <TargetSelect
                                    resourceId={modal.type === 'cameras' ? 'thingName' : 'name'}
                                    resourceLabel={modal.type === 'cameras' ? 'displayName' : undefined}
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
                    <ProvideResource resource={pitsService.jobTypes()}>
                        <JobTypeSelect
                            disabled={disabled || !create}
                            name="type"
                            required
                            onChange={inputChange}
                            value={formData.type}
                            parameters={formData.parameters}
                            onParameterChange={(param, value) => {
                                let parameters = formData.parameters;
                                if (value === '') {
                                    delete parameters[param];
                                } else {
                                    parameters[param] = value;
                                }
                                setFormData({
                                    ...formData,
                                    parameters,
                                })
                            }}
                        />
                    </ProvideResource>
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
                    <CancelButton cancelTo="/account/jobs" className="me-1" disabled={data.submitting}/>
                    {formData.status === 'IN_PROGRESS' &&
                        <Button onClick={() => setCancelModal({...cancelModal, show: true})} variant="danger" className="me-1">{icons.icon('stop-circle')} Cancel</Button>
                    }
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