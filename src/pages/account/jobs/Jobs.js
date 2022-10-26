import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import { icons } from "../../../components/common/Icons";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";

function Jobs() {
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
                return item.status === 'CANCELLED' ? icons.icon('dash-circle') : icons.icon('check-circle');
            }
        }
    ];

    return (
        <>
            <AccountBreadcrumb/>
            <ResourceList
                resource="jobs"
                resourceTitle="Job"
                resourceId="jobId"
                formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
                pagination={10}
                manuallyPage={true}
                columns={columns}
            />
        </>
    )
}

export default Jobs;