import { useEffect, useState } from "react";
import { Button, Col, Container, Form, InputGroup, Row, Spinner, ToggleButton, ToggleButtonGroup } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../components/auth/AuthContext";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import CancelButton from "../../../components/common/CancelButton";
import Header from "../../../components/common/Header";
import { useAlerts } from "../../../components/notifications/AlertContext";
import { pitsService } from "../../../lib/services";

function FormFilter(props) {
    return (
        <>
            <Form.Check name={props.name} onChange={props.onChange} checked={props.name in props.filters} type="switch" label={props.label}/>
            <br/>
            {props.name in props.filters && <>{props.children}</>}
        </>
    );
}

function ResourceButtons(props) {
    const alerts = useAlerts();
    const [ resource, setResource ] = useState({
        items: [],
        loading: true,
        nextToken: null
    });
    useEffect(() => {
        let isMounted = true;
        if (resource.loading) {
            pitsService[props.resource]().list({ nextToken: resource.nextToken })
                .then(resp => {
                    if (isMounted) {
                        setResource({
                            ...resource,
                            items: resource.items.concat(resp.items),
                            nextToken: resp.nextToken,
                            loading: resp.nextToken !== null
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load ${props.resource}: ${e.message}`);
                    setResource({
                        ...resource,
                        loading: false
                    });
                });
        }
        return () => {
            isMounted = false;
        };
    });

    return (
        <ToggleButtonGroup onChange={props.onChange} value={props.filterItems} size="sm" vertical type="checkbox">
            {resource.loading && <Spinner animation="border"/>}
            {!resource.loading && resource.items.map((item, index) => {
                return (
                    <ToggleButton
                        key={`${props.resource}-${index}`}
                        id={item[props.resourceId]}
                        variant="outline-success"
                        value={item[props.resourceId]}
                    >
                        {props.displayName(item)}
                    </ToggleButton>
                );
            })}
        </ToggleButtonGroup>
    );
}

function SubscriptionMutate() {
    const alerts = useAlerts();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();
    const create = id === 'new';
    const [ formData, setFormData ] = useState({
        id: create ? '' : id,
        endpoint: user.email || '',
        protocol: 'email',
        filter: {}
    });
    const [ data, setData ] = useState({
        validated: false,
        submitting: false
    });
    const [ content, setContent ] = useState({
        id,
        loading: !create,
    });

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.subscriptions().get(id)
                .then(existing => {
                    if (isMounted) {
                        setFormData({
                            ...formData,
                            ...existing
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load subscription ${id}: ${e.message}`);
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
        };
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
            let newFormData = { ...formData };
            for (let filterName in formData.filter) {
                if (formData.filter[filterName].length === 0) {
                    delete newFormData.filter[filterName];
                }
            }
            if (create) {
                pitsService.subscriptions().create(newFormData)
                    .then(resp => {
                        alerts.success(`Successfully created ${resp.id}.`);
                        navigate("/account/subscriptions");
                    })
                    .catch(e => {
                        alerts.error(`Failed to create ${formData.endpoint}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        });
                    });
            } else {
                pitsService.subscriptions().update(id, newFormData)
                    .then(resp => {
                        alerts.success(`Successfully updated ${resp.id}.`);
                        navigate("/account/subscriptions");
                    })
                    .catch(e => {
                        alerts.error(`Failed to update ${formData.endpoint}: ${e.message}`);
                        setData({
                            submitting: false,
                            validated: false
                        });
                    });

            }
        }
    };

    const inputChange = event => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.currentTarget.value
        })
    };

    const handleFilterToggle = event => {
        let newFormData = { ...formData };
        if (event.target.checked === true) {
            newFormData.filter[event.target.name] = [];
        } else {
            delete newFormData.filter[event.target.name];
        }
        setFormData(newFormData);
    };

    const handleWeekdayRange = (element) => {
        return {
            checked: formData.filter['DayOfWeek'] && formData.filter['DayOfWeek'].filter(item => item.numeric && item.numeric.join() === element.numeric.join()).length === 1,
            onChange: event => {
                let days = formData.filter['DayOfWeek'];
                if (event.target.checked) {
                    days.push(element);
                } else {
                    days = days.filter(item => !item.numeric || item.numeric.join() !== element.numeric.join());
                }
                setFormData({
                    ...formData,
                    filter: {
                        ...formData.filter,
                        'DayOfWeek': days
                    }
                });
            }
        }
    };

    const toggleOnChange = (name) => {
        return event => {
            setFormData({
                ...formData,
                filter: {
                    ...formData.filter,
                    [name]: event
                }
            });
        }
    };

    const isCustomRange = () => {
        return formData.filter['Hour'] && formData.filter['Hour'].filter(item => item.numeric).length !== 0;
    };

    const toggleCustomRange = event => {
        let hours = [];
        if (event.target.checked) {
            hours = [{'numeric': ['>=', 0, '<=', 23]}];
        }
        setFormData({...formData, filter: {...formData.filter, 'Hour': hours}});
    };

    const updateCustomRangeIndex = (index) => {
        return event => {
            let hours = formData.filter['Hour'];
            hours[0].numeric[index] = parseInt(event.currentTarget.value);
            setFormData({
                ...formData,
                filter: {
                    ...formData.filter,
                    'Hour': hours
                }
            });
        }
    };

    return (
        <>
            <AccountBreadcrumb replace={{[id]: formData.endpoint}}/>
            <Container>
                <Header>
                    {create ? 'Create Subscription' : `Update ${formData.endpoint}`}
                </Header>
                <Form noValidate validated={data.validated} onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label>Endpoint</Form.Label>
                            <Form.Control disabled={!create} placeholder="user@example.com" onChange={inputChange} value={formData.endpoint} name="endpoint"/>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label>Protocol</Form.Label>
                            <Form.Select disabled={!create} onChange={inputChange} name="protocol" value={formData.protocol}>
                                <option value="email">Email</option>
                            </Form.Select>
                        </Form.Group>
                    </Row>
                    <h3>
                        Filters
                    </h3>
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <FormFilter name="Group" filters={formData.filter} onChange={handleFilterToggle} label="Filter by Groups">
                                <ResourceButtons
                                    resource="groups"
                                    resourceId="name"
                                    filterItems={formData.filter["Group"]}
                                    displayName={item => item.name}
                                    onChange={toggleOnChange('Group')}
                                />
                            </FormFilter>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <FormFilter name="Camera" filters={formData.filter} onChange={handleFilterToggle} label="Filter by Camera">
                                <ResourceButtons
                                    resource="cameras"
                                    resourceId="thingName"
                                    filterItems={formData.filter["Camera"]}
                                    displayName={item => item.displayName}
                                    onChange={toggleOnChange('Camera')}
                                />
                            </FormFilter>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <FormFilter name="DayOfWeek" filters={formData.filter} onChange={handleFilterToggle} label="Filter by Day">
                                <Form.Check {...handleWeekdayRange({'numeric': ['>=', 1, '<=', 5]})} type="switch" label="Weekdays"/>
                                <Form.Check {...handleWeekdayRange({'numeric': ['>=', 6, '<=', 7]})} type="switch" label="Weekends"/>
                                <ToggleButtonGroup className="mt-2" value={formData.filter['DayOfWeek']} onChange={toggleOnChange('DayOfWeek')} type="checkbox" vertical>
                                    {['1: Mon', '2: Tues', '3: Wed', '4: Thu', '5: Fri', '6: Sat', '7: Sun']
                                        .filter(day => (formData.filter['DayOfWeek'] || [])
                                            .filter(item => item.numeric && parseInt(day.split(":")[0]) >= item.numeric[1] && parseInt(day.split(":")[0]) <= item.numeric[3])
                                            .length !== 1)
                                        .map(day => {
                                            return (
                                                <ToggleButton
                                                    key={`day-${day}`}
                                                    id={`day-${day}`}
                                                    variant="outline-success"
                                                    value={parseInt(day.split(":")[0])}
                                                >
                                                    {day}
                                                </ToggleButton>
                                            );
                                        })}
                                </ToggleButtonGroup>
                            </FormFilter>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <FormFilter name="Hour" onChange={handleFilterToggle} filters={formData.filter} label="Filter by Hour">
                                <Form.Check checked={isCustomRange()} onChange={toggleCustomRange} type="switch" label="Custom Range"/>
                                {isCustomRange() &&
                                    <InputGroup className="mt-2">
                                        <InputGroup.Text>{'>='}</InputGroup.Text>
                                        <Form.Control onChange={updateCustomRangeIndex(1)} type="number" min={0} max={23} value={formData.filter['Hour'][0].numeric[1]}/>
                                        <InputGroup.Text>{'<='}</InputGroup.Text>
                                        <Form.Control onChange={updateCustomRangeIndex(3)} type="number" min={0} max={23} value={formData.filter['Hour'][0].numeric[3]}/>
                                    </InputGroup>
                                }
                                {!isCustomRange() && 
                                <ToggleButtonGroup value={formData.filter['Hour']} onChange={toggleOnChange('Hour')} type="checkbox" vertical>
                                    {Array(24).fill().map((num, index) => index).map(index => {
                                        return (
                                            <ToggleButton
                                                key={`hour-${index}`}
                                                id={`hour-${index}`}
                                                variant="outline-success"
                                                value={index}
                                            >
                                                {index}
                                            </ToggleButton>
                                        )
                                    })}
                                </ToggleButtonGroup>
                                }
                            </FormFilter>
                        </Form.Group>
                    </Row>
                    <CancelButton className="me-1" disabled={data.submitting}/>
                    <Button disabled={data.submitting} type="submit" variant="success">{create ? 'Create' : 'Update'}</Button>
                </Form>
            </Container>
        </>
    );
}

export default SubscriptionMutate;