import React, { useEffect, useState } from "react";
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
import { pitsService } from "../../lib/services";
import { icons } from "../common/Icons";
import { useAlerts } from "../notifications/AlertContext";
import ResourcePagination from "./ResourcePagination";

function ResourceList(props) {
    const alerts = useAlerts();
    const canCreate = props.create === true || typeof(props.create) === 'undefined';
    let [ content, setContent ] = useState({
        items: [],
        additionalParams: {
            ...(props.additionalParams || {})
        },
        currentSlice: [0, props.pagination || 10],
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
            let params = { ...content.additionalParams, nextToken: content.nextToken };
            if (props.pagination) {
                params['limit'] = props.pagination;
            }
            let resource = pitsService[props.resource]();
            (props.searchParams || []).forEach(param => {
                if (param.name in params) {
                    if ('resource' in param) {
                        resource = param.resource(resource, params[param.name]);
                        delete params[param.name];
                    } else if (param.type === 'date') {
                        let date = new Date(params[param.name]);
                        params[param.name] = date.toISOString();
                    }
                }
            });
            resource.list(params).then(resp => {
                if (isMounted) {
                    let loading = resp.nextToken !== null;
                    if (loading && props.manuallyPage === true) {
                        loading = false;
                    }
                    setContent({
                        ...content,
                        items: content.items.concat(resp.items),
                        nextToken: resp.nextToken,
                        loading
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
            format: (item) => props.formatTimestamp
                ? props.formatTimestamp(item.createTime)
                : formatDate(item.createTime)
        }
    ];

    const isEmpty = content.items.length === 0;
    let footerLabel = '';
    if (content.loading) {
        footerLabel = <Spinner animation="border"/>;
    } else if (isEmpty) {
        footerLabel = `No ${props.resource} found.`;
    } else if (canCreate) {
        footerLabel = <Button as={Link} to={`/account/${props.resource}/new`} variant="success">{icons.icon('plus')} New {props.resourceTitle}</Button>;
    }

    const handleLoadMore = event => {
        setContent({
            ...content,
            loading: true,
        })
    };

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
        let handleDelete = props.handleDelete;
        if (typeof handleDelete === 'undefined') {
            handleDelete = (item, onSuccess, onComplete) => {
                pitsService[props.resource]().delete(item[props.resourceId])
                    .then(onSuccess)
                    .finally(onComplete);
            };
        }
        handleDelete(modal.item, resp => {
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
        }, handleModalClose);
    };

    const handleSearchOnChange = event => {
        let newParams = { ...content.additionalParams };
        if (event.currentTarget.value === '') {
            delete newParams[event.currentTarget.name];
        } else {
            newParams[event.currentTarget.name] = event.currentTarget.value;
        }
        setContent({
            ...content,
            items: [],
            nextToken: null,
            additionalParams: newParams,
            loading: true
        })
    };

    const searchedItems = content.items.filter(item => item[props.resourceId].match(search.text));
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

    return (
        <>
            <Modal show={modal.visible} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete {props.formatResource ? props.formatResource(modal.item) : modal.item[props.resourceId]}</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete <strong>{props.formatResource ? props.formatResource(modal.item) : modal.item[props.resourceId]}</strong>?</Modal.Body>
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
                                                {param.as && param.as({value: content.additionalParams[param.name] || '', disabled: content.loading || content.additionalParams[param.disabledIfSet], onChange: handleSearchOnChange})}
                                                {param.type &&
                                                    <Form.Control defaultValue={content.additionalParams[param.name] || ''} name={param.name} onChange={handleSearchOnChange} type={param.type}/>
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
                    finished={!content.nextToken && !content.loading}
                    onLoadMore={handleLoadMore}
                    onSelectedSlice={(start, end) => setContent({...content, currentSlice: [start, end]})}
                />

                <Table responsive hover>
                    <thead>
                        <tr>
                            {columns.map(column => <th className={column.centered ? 'text-center' : ''} key={`column-${column.label}`}>{column.label}</th>)}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {searchedItems.slice(content.currentSlice[0], content.currentSlice[1]).map((item, index) => {
                            let editLink = props.formatEdit ? props.formatEdit(item) : `/account/${props.resource}/${item[props.resourceId]}`;
                            return (
                                <tr key={`item-${index}`}>
                                    {columns.map(column => <td className={column.centered ? 'text-center' : ''} key={`item-${index}-${column.label}`}>{column.format(item)}</td>)}
                                    <td>
                                        {!props.disableMutate && <Button size="sm" className="me-1" as={Link} to={editLink} variant="secondary">{icons.icon('pencil')}</Button>}
                                        {(props.actions || []).map(action => <Button size="sm" className="me-1" variant="secondary" onClick={action.onClick(item)} key={`item-${index}-${action.icon}`}>{icons.icon(action.icon)}</Button>)}
                                        {!props.disableMutate && <Button size="sm" onClick={handleDeleteModal(item)} variant="danger">{icons.icon('trash')}</Button>}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="text-center" colSpan={columns.length + 1}>
                                {footerLabel}
                                {(!content.loading && content.nextToken) &&
                                <Button onClick={handleLoadMore} variant="outline-secondary">{icons.icon('arrow-clockwise')} Load More</Button>
                                }
                            </td>
                        </tr>
                    </tfoot>
                </Table>
            </Container>
        </>
    );
}

export default ResourceList;