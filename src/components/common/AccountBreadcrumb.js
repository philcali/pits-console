import { Breadcrumb } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

function AccountBreadcrumb(props) {
    const location = useLocation();
    const paths = [
        {
            to: '/dashboard',
            text: 'Dashboard'
        }
    ];
    let [ base, ...rest ] = location.pathname.split('/');
    let trackingPath = [base];
    rest.forEach(part => {
        trackingPath.push(part);
        let element = {};
        element.to = trackingPath.join('/');
        element.active = element.to === location.pathname;
        if (part === 'account') {
            element.text = 'Manage Account';
        } else if (part === 'groups') {
            element.text = 'Groups';
        } else if (part === 'cameras') {
            element.text = 'Cameras';
        } else if (part === 'subscriptions') {
            element.text = 'Subscriptions';
        } else if (part === 'videos') {
            element.text = 'Motion Videos';
        } else if (part === 'configuration') {
            element.text = 'Configuration';
        } else {
            element.text = part;
        }
        if (props.replace && props.replace[part]) {
            element.text = props.replace[part];
        }
        if (!props.skipParts || props.skipParts.indexOf(part) === -1) {
            paths.push(element);
        }
    });
    return (
        <Breadcrumb className="pt-3 ps-3 pb-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
            {paths.map((path, index) => {
                let props = {key: `item-${path.to}`};
                if (paths.length -1 === index || path.active) {
                    props.active = true;
                } else {
                    props = {
                        linkAs: Link,
                        linkProps: { to: path.to }
                    }
                }
                return (
                    <Breadcrumb.Item key={`item-${path.text.replace(' ', '-')}`} {...props}>{path.text}</Breadcrumb.Item>
                )
            })}
        </Breadcrumb>
    );
}

export default AccountBreadcrumb;