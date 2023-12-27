import React, { useState } from "react";
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
import { formatDate } from "../../lib/format";
import Header from "../common/Header";
import { icons } from "../common/Icons";
import { useAlerts } from "../notifications/AlertContext";
import ProvideResource from "./ProvideResource";
import { useResource } from "./ResourceContext";
import ResourcePagination from "./ResourcePagination";

export function ResourceTable(props) {
    const alerts = useAlerts();
    const canCreate = props.create === true || typeof(props.create) === 'undefined';
    const resource = useResource();
    let [ modal, setModal ] = useState({
        visible: false,
        submitting: false,
        item: {}
    });

    let [ search, setSearch ] = useState({
        text: ''
    });

    let [ currentSlice, setCurrentSlice ] = useState([
        0, props.pagination || 10
    ]);

    const columns = [
        ...props.columns,
        {
            label: 'Created At',
            centered: true,
            format: (item) => props.formatTimestamp
                ? props.formatTimestamp(item[props.createTimeField || 'createTime'])
                : formatDate(item[props.createTimeField || 'createTime'])
        }
    ];

    const isEmpty = resource.items.length === 0;
    let footerLabel = '';
    if (resource.loading) {
        footerLabel = <Spinner animation="border"/>;
    } else if (isEmpty) {
        footerLabel = `No ${props.resourceTitle}s found.`;
    } else if (canCreate) {
        footerLabel = <Button as={Link} to={`/account/${resource.name}/new`} variant="success">{icons.icon('plus')} New {props.resourceTitle}</Button>;
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
    };

    const handleItemDelete = () => {
        setModal({
            ...modal,
            submitting: true
        });
        let handleDelete = props.handleDelete;
        if (typeof handleDelete === 'undefined') {
            handleDelete = (item, onSuccess, onComplete) => {
                resource.delete(item[props.resourceId])
                    .then(onSuccess)
                    .finally(onComplete);
            };
        }
        handleDelete(modal.item, resp => {
            if (resp) {
                alerts.success(`Successfully deleted ${modal.item[props.resourceId]}.`);
                resource.reload();
            } else {
                alerts.error(`Failed to delete ${modal.item[props.resourceId]}.`);
            }
        }, handleModalClose);
    };

    const handleSearchOnChange = event => {
        let newParams = { ...resource.additionalParams };
        newParams[event.currentTarget.name] = event.currentTarget.value;
        (props.searchParams || []).forEach(param => {
            if (param.name in newParams) {
                if ('resource' in param) {
                    resource.setResource(param.resource(newParams[param.name]));
                    delete newParams[param.name];
                } else if (newParams[param.name] === '') {
                    delete newParams[param.name];
                } else if (param.type === 'date' || param.type === 'datetime-local') {
                    let date = new Date(newParams[param.name]);
                    newParams[param.name] = date.toISOString();
                }
            }
        });
        resource.reload(newParams);
    };

    const hideIfSet = param => {
        if (param.hideIfSet) {
            let keys = Object.keys(props.additionalParams); 
            for (let index = 0; index < keys.length; index++) {
                if (param.hideIfSet.indexOf(keys[index]) !== -1) {
                    return false;
                }
            }
        }
        return true;
    };

    const searchedItems = resource.items.filter(item => item[props.resourceId].match(search.text));
    const isActions = (props.actions || []).length > 0
        || !(props.disableMutate || props.disableEdit)
        || !(props.disableMutate || props.disableDelete);

    return (
        <>
            <Modal size="lg" show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete {props.formatResource ? props.formatResource(modal.item) : modal.item[props.resourceId]}</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete <strong>{props.formatResource ? props.formatResource(modal.item) : modal.item[props.resourceId]}</strong>?</Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleModalClose}>Cancel</Button>
                    <Button variant="danger" disabled={modal.submitting} onClick={handleItemDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            <div className="mb-3">
                <ButtonToolbar className="justify-content-between mb-md-0">
                    <InputGroup>
                        {props.hideSearchText !== true &&
                        <>
                            <InputGroup.Text>{icons.icon('search')}</InputGroup.Text>
                            <Form.Control
                                value={search.text}
                                onChange={(event) => setSearch({text: event.currentTarget.value})}
                                placeholder="Search"
                            />
                        </>
                        }
                        {props.searchParams &&
                            <>
                                {props.searchParams.filter(hideIfSet).map(param => {
                                    return (
                                        <React.Fragment key={`param-${param.name}`}>
                                            <InputGroup.Text>{param.label}</InputGroup.Text>
                                            {param.as && param.as({value: resource.additionalParams[param.name] || '', disabled: resource.loading || resource.additionalParams[param.disabledIfSet], onChange: handleSearchOnChange})}
                                            {param.type &&
                                                <Form.Control defaultValue={resource.additionalParams[param.name] || ''} name={param.name} onChange={handleSearchOnChange} type={param.type}/>
                                            }
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        }
                    </InputGroup>
                    {canCreate &&
                    <ButtonGroup>
                        <Button as={Link} to={`/account/${props.resource}/new`} variant="success">{icons.icon('plus')} Create</Button>
                    </ButtonGroup>
                    }
                </ButtonToolbar>
            </div>

            <ResourcePagination
                total={searchedItems.length}
                perPage={props.pagination || 10}
                finished={!resource.nextToken && !resource.loading}
                onLoadMore={resource.nextPage}
                onSelectedSlice={(start, end) => setCurrentSlice([start, end])}
            />

            <Table responsive hover className="text-nowrap">
                <thead>
                    <tr>
                        {columns.map(column => <th className={column.centered ? 'text-center' : ''} key={`column-${column.label}`}>{column.label}</th>)}
                        {isActions && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {searchedItems.slice(currentSlice[0], currentSlice[1]).map((item, index) => {
                        let editLink = props.formatEdit ? props.formatEdit(item) : `/account/${props.resource}/${item[props.resourceId]}`;
                        return (
                            <tr key={`item-${index}`}>
                                {columns.map(column => <td className={column.centered ? 'text-center' : ''} key={`item-${index}-${column.label}`}>{column.format(item)}</td>)}
                                {isActions &&
                                <td>
                                    {!(props.disableMutate || props.disableEdit) && <Button size="sm" className="me-1" as={Link} to={editLink} variant="secondary">{icons.icon('pencil')}</Button>}
                                    {(props.actions || []).map(action => <Button size="sm" className="me-1" variant="secondary" onClick={action.onClick(item, resource.reload)} key={`item-${index}-${action.icon}`}>{icons.icon(action.icon)}</Button>)}
                                    {!(props.disableMutate || props.disableDelete) && <Button size="sm" onClick={handleDeleteModal(item)} variant="danger">{icons.icon('trash')}</Button>}
                                </td>
                                }
                            </tr>
                        )
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="text-center" colSpan={columns.length + 1}>
                            {footerLabel}
                            {(!resource.loading && resource.nextToken) &&
                            <Button onClick={resource.nextPage} variant="outline-secondary">{icons.icon('arrow-clockwise')} Load More</Button>
                            }
                        </td>
                    </tr>
                </tfoot>
            </Table>
        </>
    );
}

function ResourceList(props) {
    return (
        <>
            <Container>
                <Header>{props.resourceTitle}s</Header>

                <ProvideResource
                    resource={props.resource}
                    additionalParams={{
                        ...(props.additionalParams || {}),
                        limit: props.pagination || 10
                    }}
                    manuallyPage={props.manuallyPage}
                >
                    <ResourceTable {...props}/>
                </ProvideResource>
            </Container>
        </>
    );
}

export default ResourceList;