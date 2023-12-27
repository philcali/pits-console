import { Link, useNavigate } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import { icons } from "../../../components/common/Icons";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import { useAlerts } from "../../../components/notifications/AlertContext";
import ResourceList from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";

const TIMEOUT = 5000;
const INTERVAL_TIME = 1000;

const unixTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

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
                    pitsService.cameras()
                        .resource(item.thing_name, 'stats')
                        .create({})
                        .then(resp => {
                            alerts.success(`Forced a health signal to ${displayNameMap[item.thing_name]}.`);
                            let max = unixTimestamp() + TIMEOUT;
                            let timeout = setInterval(() => {
                                let now = unixTimestamp()
                                if (now - max >= TIMEOUT) {
                                    alerts.error(`Failed to update health for ${displayNameMap[item.thing_name]} in time.`);
                                    clearTimeout(timeout);
                                } else {
                                    pitsService.stats().list({ thingName: [ item.thing_name ] })
                                        .then(lsresp => {
                                            if (lsresp.items[0].createTime > item.createTime) {
                                                clearInterval(timeout);
                                                reload();
                                            }
                                        })
                                        .catch(e => {
                                            clearInterval(timeout);
                                        });
                                }
                            }, INTERVAL_TIME);
                        })
                        .catch(e => {
                            alerts.error(`Failed to post to ${displayNameMap[item.thing_name]}: ${e.message}`);
                        });
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