import { Button, Col, Modal, Row, Spinner } from "react-bootstrap";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { useEffect, useState } from "react";
import { pitsService } from "../../../lib/services";
import { useAlerts } from "../../../components/notifications/AlertContext";

export function JobCancelationModal(props) {
    const alerts = useAlerts();
    const [ loading, setLoading ] = useState(false);

    useEffect(() => {
        if (loading && !props.disabled) {
            props.onCancel({starting: true});
            pitsService.jobs()
                .resource(props.job.jobId, 'cancel')
                .create({ force: true })
                .then(() => {
                    alerts.success(`Successfully canceled job ${props.job.jobId}.`)
                })
                .catch(e => {
                    alerts.error(`Failed to cancel job ${props.job.jobId}: ${e.message}`);
                })
                .finally(() => {
                    setLoading(false);
                    props.onHide();
                    props.onCancel({starting: false});
                })
        }
    });

    return (
        <Modal size="lg" show={props.show} onHide={props.onHide}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Cancel {props.job.type} Job {props.job.jobId}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {props.jobLoading &&
                    <Spinner size="lg" animation="border"/>
                }
                {!props.jobLoading && props.job.status === 'IN_PROGRESS' &&
                    <>
                        Are you sure you want to <strong>cancel</strong> job {props.job.jobId}?
                    </>
                }
                {!props.jobLoading && props.job.status !== 'IN_PROGRESS' &&
                    <>
                        The job <strong>{props.job.jobId}</strong> is currently in <strong>{props.job.status?.toLowerCase()}</strong> status and cannot be canceled.
                    </>
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={props.onHide}>Close</Button>
                <Button variant="danger" onClick={() => setLoading(true)} disabled={loading || props.jobLoading || props.job.status !== 'IN_PROGRESS'}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}

function Jobs() {
    const [ modal, setModal ] = useState({
        show: false,
        jobLoading: false,
        job: {}
    });

    const [ loading, setLoading ] = useState(false);

    const columns = [
        {
            label: 'ID',
            format: item => item.jobId
        },
        {
            label: 'Type',
            format: item => item.type.charAt(0).toString().toUpperCase() + item.type.substring(1)
        },
        {
            label: 'Status',
            centered: true,
            format: item => {
                let textColor = 'success';
                let icon = 'check-circle';
                if (item.status === 'CANCELED') {
                    textColor = 'danger';
                    icon = 'dash-circle';
                }
                return <span className={`text-${textColor}`}>{icons.icon(icon)}</span>
            }
        }
    ];

    const actions = [
        {
            icon: 'stop-circle',
            variant: 'outline-danger',
            onClick: item => {
                return () => {
                    setModal({
                        ...modal,
                        show: true,
                        jobLoading: true,
                        job: item,
                    });
                    pitsService.jobs().get(item.jobId).then(job => {
                        setModal({
                            ...modal,
                            show: true,
                            jobLoading: false,
                            job,
                        });
                    });
                };
            }
        }
    ];

    return (
        <>
            <JobCancelationModal
                disabled={loading}
                show={modal.show}
                onHide={() => setModal({...modal, show: false})}
                job={modal.job}
                jobLoading={modal.jobLoading}
                onCancel={({starting}) => setLoading(starting)}
            />
            <AccountBreadcrumb/>
            {loading &&
                <Row>
                    <Col className="text-center">
                        <Spinner size="lg" animation="border"/>
                    </Col>
                </Row>
            }
            {!loading &&
                <ResourceList
                    resource="jobs"
                    resourceTitle="Job"
                    resourceId="jobId"
                    formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
                    pagination={10}
                    manuallyPage={true}
                    actions={actions}
                    columns={columns}
                />
            }
        </>
    )
}

export default Jobs;