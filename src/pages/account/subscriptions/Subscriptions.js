import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";

function Subscriptions() {
    const columns = [
        {
            label: 'Endpoint',
            format: item => item.endpoint
        },
        {
            label: 'Protocol',
            format: item => {
                switch (item.protocol) {
                    case 'email':
                        return icons.icon('envelope', 24);
                    default:
                        return item.protocol;
                }
            }
        }
    ];

    return (
        <ResourceList
            resource="subscriptions"
            resourceTitle="Subscription"
            resourceId="id"
            formatResource={item => item.endpoint}
            columns={columns}
        />
    );
}

export default Subscriptions;