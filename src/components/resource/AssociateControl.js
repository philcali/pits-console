import { useEffect, useState } from "react";
import { Badge, Button, Spinner, Table } from "react-bootstrap";
import { pitsService } from "../../lib/services";
import { icons } from "../common/Icons";

function AssociateControl(props) {
    let [ other, setOther ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });
    let [ associated, setAssociated ] = useState({
        items: [],
        nextToken: null,
        loading: true
    });

    useEffect(() => {
        let isMounted = true;
        if (other.loading) {
            pitsService[props.associatedResource]().list({ nextToken: other.nextToken }).then(resp => {
                if (isMounted) {
                    setOther({
                        ...other,
                        items: other.items.concat(resp.items),
                        nextToken: resp.nextToken,
                        loading: resp.nextToken !== null
                    });
                }
            })
        }
        if (associated.loading) {
            pitsService[props.resource]().resource(props.resourceId, props.associatedResource)
                .list({ nextToken: associated.nextToken })
                .then(resp => {
                    if (isMounted) {
                        setAssociated({
                            ...associated,
                            items: associated.items.concat(resp.items),
                            nextToken: resp.nextToken,
                            loading: resp.nextToken !== null
                        });
                    }
                })
        }
        return () => {
            isMounted = false;
        }
    });

    const toggleAssociate = (id, isAssociated) => {
        return event => {
            if (isAssociated) {
                pitsService[props.resource]().resource(props.resourceId, props.associatedResource)
                    .delete(id)
                    .then(resp => {
                        setAssociated({
                            ...associated,
                            loading: true,
                            items: [],
                            nextToken: null
                        })
                    });
            } else {
                pitsService[props.resource]().resource(props.resourceId, props.associatedResource)
                    .create({ [props.associatedResource]: [ id ]})
                    .then(resp => {
                        setAssociated({
                            ...associated,
                            loading: true,
                            items: [],
                            nextToken: null
                        })
                    });
            }
        };
    };

    const assocaitedMap = {};
    if (!other.loading && !associated.loading) {
        associated.items.forEach(associated => {
            assocaitedMap[associated.id] = associated;
        });
    }

    return (
        <>
           <h3 className="mb-3" style={{borderBottom: '1px solid #ddd'}}>Associated {props.title}</h3>
           <Table responsive>
               <thead>
                   <tr>
                       <td>Name</td>
                       <td>Action</td>
                   </tr>
               </thead>
               <tbody>
                   {other.loading && <tr><td className="text-center" colSpan={2}><Spinner animation="border"/></td></tr>}
                   {!other.loading &&
                       <>
                       {other.items.map(other => {
                           let isAssociated = assocaitedMap[other[props.associatedResourceId]];
                           return (
                               <tr key={`${props.associatedResource}-${other[props.associatedResourceId]}`}>
                                   <td><Badge text={isAssociated ? 'light' : 'dark'} bg={isAssociated ? 'success' : 'light'}>{other[props.associatedResourceId]}</Badge></td>
                                   <td><Button disabled={associated.loading} size="sm" onClick={toggleAssociate(other[props.associatedResourceId], isAssociated)} variant="primary">{icons.icon(isAssociated ? 'minus' : 'plus')} Toggle</Button></td>
                               </tr>
                           );
                       })}
                       </>
                   }
               </tbody>
           </Table>
        </>
    )
}

export default AssociateControl;