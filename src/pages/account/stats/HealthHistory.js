import { Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";
import { statsColums } from "./Stats";

function HealthHistoryTable() {
    const resource = useResource();

    const searchParams = [
        {
            'name': 'startTime',
            'label': 'After',
            'type': 'date',
        },
        {
            'name': 'endTime',
            'label': 'Before',
            'type': 'date'
        }
    ];

    const columns = statsColums(item => resource.items[0].displayName);

    return (
        <>
            {resource.loading && <Spinner animation="border"/>}
            {!resource.loading &&
                <>
                    <AccountBreadcrumb replace={{
                        [resource.items[0].thingName]: `${resource.items[0].displayName} Metrics`
                    }}/>
                    <ResourceList
                        resource={pitsService.cameras().resource(resource.items[0].thingName, 'stats')}
                        resourceTitle={`${resource.items[0].displayName} Metric`}
                        resourceId="thing_name"
                        hideSearchText={true}
                        formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
                        create={false}
                        manuallyPage={true}
                        columns={columns}
                        disableMutate={true}
                        searchParams={searchParams}
                    />
                </>
            }
        </>
    );
}

function HealthHistory() {
    const { thingName } = useParams();

    return (
        <>
            <ProvideResource
                resource="cameras"
                additionalParams={{thingName: [thingName]}}
            >
                <HealthHistoryTable/>
            </ProvideResource>
        </>
    );
}

export default HealthHistory;