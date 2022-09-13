import { Link } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import { icons } from "../../../components/common/Icons";
import ProvideResource from "../../../components/common/ProvideResource";
import { useResource } from "../../../components/common/ResourceContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";

function StatsTable() {
    const resource = useResource();
    const displayNameMap = {};
    resource.items.forEach(item => {
        displayNameMap[item.thingName] = item.displayName;
    });
    const columns = [
        {
            label: 'Camera',
            format: item => {
                return <Link to={`/account/cameras/${item.thing_name}/configuration`}>{displayNameMap[item.thing_name]}</Link>;
            }
        },
        {
            label: 'Version',
            centered: true,
            format: item => {
                return item.version
            }
        },
        {
            label: 'Health',
            centered: true,
            format: item => {
                const isDown = item.stats === 'UNHEALTHY'
                return <span className={isDown ? 'text-danger' : 'text-success'}>{icons.icon(isDown ? 'dash-circle' : 'check-circle')}</span>
            }
        },
        {
            label: 'Recording',
            centered: true,
            format: item => {
                return <span className={item.recording_status ? 'text-success' : 'text-danger'}>{icons.icon(item.recording_status ? 'camera-video' : 'camera-video-off')}</span>
            }
        },
        {
            label: 'Mem Usage',
            centered: true,
            format: item => {
                return Math.floor((item.mem_avail / item.mem_total) * 100) + '%';
            }
        },
        {
            label: 'Disk Usage',
            centered: true,
            format: item => {
                return Math.floor((item.disk_used / item.disk_free) * 100) + '%';
            }
        }
    ];

    const actions = [
        {
            icon: 'activity',
            onClick: item => {
                return () => {
                    // TODO: fix this in the API
                    // unconventional subresource list
                    // navigate(`/account/stats/${item.thing_name}`);
                }
            }
        },
        {
            icon: 'arrow-clockwise',
            onClick: item => {
                return () => {
                    // TODO: fix this in the API
                    // unconventional create
                }
            }
        }
    ]

    return (
        <ResourceList
            resource="stats"
            resourceTitle="Health Metric"
            resourceId="thing_name"
            hideSearchText={true}
            formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
            create={false}
            columns={columns}
            actions={actions}
            disableMutate={true}
        />
    );
}

function Stats() {
    return (
        <>
            <AccountBreadcrumb/>
            <ProvideResource resource="cameras">
                <StatsTable/>
            </ProvideResource>
        </>
    )
}

export default Stats;