import { useEffect, useState } from "react";
import {
    Button,
    ButtonGroup,
    ButtonToolbar,
    Container,
    Form,
    InputGroup,
    Modal,
    Spinner,
    Table
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { pitsService } from "../../lib/services";
import Footer from "../common/Footer";
import { icons } from "../common/Icons";
import { useAlerts } from "../notifications/AlertContext";

function ResourceList(props) {
    const alerts = useAlerts();
    let [ content, setContent ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });

    let [ modal, setModal ] = useState({
        visible: false,
        submitting: false,
        item: {}
    });

    let [ search, setSearch ] = useState({
        text: ''
    })

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService[props.resource]().list({ nextToken: content.nextToken }).then(resp => {
                if (isMounted) {
                    setContent({
                        ...content,
                        items: content.items.concat(resp.items),
                        nextToken: resp.nextToken,
                        loading: resp.nextToken !== null
                    });
                }
            });
        }
        return () => {
            isMounted = false;
        }
    });

    const columns = [
        ...props.columns,
        {
            label: 'Created At',
            format: (item) => new Date(item.createTime * 1000)
                .toLocaleDateString()
                .split("/")
                .map(n => n.length === 1 ? `0${n}` : n)
                .join('/')
        }
    ];

    const isEmpty = content.items.length === 0;
    let footerLabel;
    if (content.loading) {
        footerLabel = <Spinner animation="border"/>;
    } else if (isEmpty) {
        footerLabel = `No ${props.resource} found.`;
    } else {
        footerLabel = <Button as={Link} to={`/account/${props.resource}/new`} variant="success">{icons.icon('plus')} New {props.resourceTitle}</Button>
    }

    const handleModalClose = () => {
        setModal({
            ...modal,
            item: {},
            visible: false,
            submitting: false,
        });
    };

    const handleDeleteModal = item => {
        return (e) => {
            setModal({
                ...modal,
                item,
                visible: true
            });
        };
    }

    const handleItemDelete = () => {
        setModal({
            ...modal,
            submitting: true
        });
        pitsService[props.resource]().delete(modal.item[props.resourceId])
            .then(resp => {
                if (resp) {
                    alerts.success(`Successfully deleted ${modal.item[props.resourceId]}.`);
                    setContent({
                        ...content,
                        items: [],
                        nextToken: null,
                        loading: true
                    });
                } else {
                    alerts.error(`Failed to delete ${modal.item[props.resourceId]}.`);
                }
            })
            .finally(handleModalClose);
    };

    return (
        <>
            <Modal show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete {modal.item[props.resourceId]}</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete <strong>{modal.item[props.resourceId]}</strong>?</Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="danger" disabled={modal.submitting} onClick={handleItemDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>
            <Container>
                <h2 className="pt-3 pb-2 mb-3" style={{ borderBottom: '1px solid #ddd' }}>
                    {props.resourceTitle}s
                </h2>

                <div className="mb-3">
                    <ButtonToolbar className="justify-content-between mb-md-0">
                        <InputGroup>
                            <InputGroup.Text>{icons.icon('search')}</InputGroup.Text>
                            <Form.Control
                                value={search.text}
                                onChange={(event) => setSearch({text: event.currentTarget.value})}
                                placeholder="Search"
                            />
                        </InputGroup>
                        <ButtonGroup>
                            <Button as={Link} to={`/account/${props.resource}/new`} variant="success">{icons.icon('plus')} Create</Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </div>

                <Table responsive hover>
                    <thead>
                        <tr>
                            {columns.map(column => <th key={`column-${column.label}`}>{column.label}</th>)}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {content.items.filter(item => item[props.resourceId].match(search.text)).map((item, index) => {
                            return (
                                <tr key={`item-${index}`}>
                                    {columns.map(column => <td key={`item-${index}-${column.label}`}>{column.format(item)}</td>)}
                                    <td>
                                        <Button size="sm" className="me-1" as={Link} to={`/account/${props.resource}/${item[props.resourceId]}`} variant="secondary">{icons.icon('pencil')}</Button>
                                        {(props.actions || []).map(action => <Button size="sm" className="me-1" variant="secondary" onClick={action.onClick(item)} key={`item-${index}-${action.icon}`}>{icons.icon(action.icon)}</Button>)}
                                        <Button size="sm" onClick={handleDeleteModal(item)} variant="danger">{icons.icon('trash')}</Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="text-center" colSpan={columns.length + 1}>{footerLabel}</td>
                        </tr>
                    </tfoot>
                </Table>
                <Footer/>
            </Container>
        </>
    );
}

export default ResourceList;