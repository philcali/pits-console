import { Link, useNavigate } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import { icons } from "../../../components/common/Icons";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import { useAlerts } from "../../../components/notifications/AlertContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { useConnection } from "../../../components/connection/ConnectionContext";


export const statsColums = (getDisplayName) => {
    return [
        {
            label: 'Camera',
            format: item => {
                return <Link to={`/account/cameras/${item.thing_name}/configuration`}>{getDisplayName(item)}</Link>;
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
            label: 'OS',
            centered: true,
            format: item => {
                return [
                    (item.os_id || 'NA'),
                    (item.os_version || 'NA')
                ].join(': ').replace('\n', '')
            }
        },
        {
            label: 'Python',
            centered: true,
            format: item => {
                return item.python_version || 'NA'
            }
        },
        {
            label: 'IP',
            centered: true,
            format: item => {
                return item.ip_addr
            }
        },
        {
            label: 'Health',
            centered: true,
            format: item => {
                const isDown = item.status === 'UNHEALTHY'
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
            label: 'Mem Avail',
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
};

function StatsTable() {
    const resource = useResource();
    const connection = useConnection();
    const alerts = useAlerts();
    const navigate = useNavigate();
    const displayNameMap = {};
    resource.items.forEach(item => {
        displayNameMap[item.thingName] = item.displayName;
    });

    const columns = statsColums(item => displayNameMap[item.thing_name]);
    const actions = [
        {
            icon: 'activity',
            onClick: item => {
                return () => {
                    navigate(`/account/stats/${item.thing_name}`);
                }
            }
        },
        {
            icon: 'arrow-clockwise',
            onClick: (item, reload) => {
                return () => {
                    connection.managerInvoke({
                        camera: item.thing_name,
                        event: {
                            name: 'health'
                        }
                    }).then(invoke => {
                        alerts.success(`Successfully received health command: ${invoke.connection.invoke_id}`);
                        reload();
                    }).catch(alerts.error);
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