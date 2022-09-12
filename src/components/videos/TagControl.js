import { useEffect, useState } from "react";
import { Badge, Button, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { pitsService } from "../../lib/services";
import Header from "../common/Header";
import { icons } from "../common/Icons";
import ProvideResource from "../common/ProvideResource";
import { useResource } from "../common/ResourceContext";
import { useAlerts } from "../notifications/AlertContext";

function TagTable(props) {
    const resource = useResource();
    const associatedMap = {};
    props.associations.items.forEach(item => {
        associatedMap[item.id] = item;
    });

    return (
        <Table responsive>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {resource.loading && <tr><td colSpan={2}><Spinner animation="border"/></td></tr>}
                {!resource.loading &&
                    <>
                        {resource.items.map(tag => {
                            let isAssociated = associatedMap[tag.name];
                            return (
                                <tr key={`tag-${tag.name}`}>
                                    <td><Badge text={isAssociated ? 'light' : 'dark'} bg={isAssociated ? 'success' : 'light'}>{tag.name}</Badge></td>
                                    <td>
                                        <Button className="me-1" as={Link} to={`/account/tags/${tag.name}`} size="sm" variant="secondary">{icons.icon('pencil')}</Button>
                                        <Button disabled={props.disabled} size="sm" onClick={event => props.onToggle(tag.name, isAssociated)}variant="primary">{icons.icon(isAssociated ? 'minus' : 'plus')} Toggle</Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </>
                }
            </tbody>
        </Table>
    );
}

function TagControl(props) {
    const alerts = useAlerts();
    const [ disabled, setDisabled ] = useState(false);
    const [ resource, setResource ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (resource.loading) {
            pitsService.videos()
                .resource(props.video.motionVideo, 'cameras')
                .resource(props.video.thingName, 'tags')
                .list({ nextToken: resource.nextToken })
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
                    alerts.error(`Failed to load associations: ${e.message}`);
                    if (isMounted) {
                        setResource({
                            ...resource,
                            loading: false
                        });
                    }
                });
        }
        return () => {
            isMounted = false;
        }
    });

    const onToggle = (tagName, associated) => {
        setDisabled(true);
        let thunk = (i) => associated ?
            pitsService.videos()
                .resource(props.video.motionVideo, 'cameras')
                .resource(props.video.thingName, 'tags')
                .delete(i) :
            pitsService.tags()
                .resource(i, 'videos')
                .create({ videos: [props.video] });
        thunk(tagName)
            .then(resp => {
                setResource({
                    items: [],
                    nextToken: null,
                    loading: true
                });
            })
            .catch(e => {
                alerts.error(`Failed to toggle ${tagName}: ${e.message}`);
            })
            .finally(() => {
                setDisabled(false);
            });
    };

    return (
        <>
            <Header as="h4">Associate Tags</Header>
            <ProvideResource resource="tags">
                <TagTable onToggle={onToggle} disabled={disabled || resource.loading} video={props.video} associations={resource}/>
            </ProvideResource>
        </>
    );
}

export default TagControl;