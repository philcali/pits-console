import { Container, Spinner } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { useParams } from "react-router-dom";
import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import Header from "../../../components/common/Header";
import ProvideResource from "../../../components/resource/ProvideResource";
import { useResource } from "../../../components/resource/ResourceContext";
import { ResourceTable } from "../../../components/resource/ResourceList";
import { formatDate, formatTime } from "../../../lib/format";
import { pitsService } from "../../../lib/services";
import { statsColums } from "./Stats";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement
} from 'chart.js';
import { useEffect } from "react";

function HealthHistoryGraph({ camera }) {
    const resource = useResource();

    const options = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            title: {
                display: true,
                text: `${camera.displayName} Health Over Time`
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left'
            },
            y1: {

                type: 'linear',
                display: true,
                position: 'right'
            }
        }
    }

    const startTime = resource.additionalParams.startTime;
    const endTime = resource.additionalParams.endTime;
    const genKey = currentDate => {
        let month = currentDate.getMonth() + 1;
        let day = currentDate.getDate();
        return `${month < 10 ? '0' + month : month}/${day < 10 ? '0' + day : day}`;
    }

    let startDate = new Date(startTime);
    let endDate = new Date(endTime);
    let dailyValues = {};
    let currentDate = startDate;
    while (currentDate <= endDate) {
        dailyValues[genKey(currentDate)] = [];
        currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    }

    resource.items.forEach(item => {
        let createDate = new Date(item.createTime * 1000);
        let memAvail = (item.mem_avail / item.mem_total) * 100;
        let diskUsage = (item.disk_used / item.disk_free) * 100;
        dailyValues[genKey(createDate)].push([memAvail, diskUsage]);
    });

    const data = {
        labels: Object.keys(dailyValues),
        datasets: [
            {
                label: 'Mem Avail%',
                data: Object.values(dailyValues)
                    .map(values => values.length === 0 ? 0 : values.reduce((left, right) => left + right[0], 0) / values.length),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y'
            },
            {
                label: 'Disk Usage%',
                data: Object.values(dailyValues)
                    .map(values => values.length === 0 ? 0 : values.reduce((left, right) => left + right[1], 0) / values.length),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgb(53, 162, 235, 0.5)',
                yAxisID: 'y1'
            }
        ]
    };

    return (
        <Line options={options} data={data}/>
    );
}

function HealthHistoryList({ camera }) {
    const resource = useResource();

    const columns = [
        ...statsColums(item => camera.displayName),
        {
            label: 'Motions',
            centered: true,
            format: item => {
                return item.motion_captured;
            }
        }
    ];

    return (
        <ResourceTable
            resource={resource}
            resourceId="thing_name"
            columns={columns}
            pagination={50}
            disableMutate={true}
            hideSearchText={true}
            create={false}
            resourceTitle="Health Metric"
            formatTimestamp={createTime => `${formatDate(createTime)} ${formatTime(createTime)}`}
        />
    );
}

function HealthHistoryTable() {
    const resource = useResource();

    const initialStart = new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
    const initialEnd = new Date().toISOString();

    return (
        <>
            {resource.loading && <Spinner animation="border"/>}
            {!resource.loading &&
                <>
                    <AccountBreadcrumb replace={{
                        [resource.items[0].thingName]: `${resource.items[0].displayName} Metrics`
                    }}/>
                    <ProvideResource
                        resource={pitsService.cameras().resource(resource.items[0].thingName, 'stats')}
                        additionalParams={{
                            endTime: initialEnd,
                            startTime: initialStart
                        }}
                    >
                        <Container>
                            <Header>{resource.items[0].displayName} Metrics</Header>
                            <HealthHistoryGraph camera={resource.items[0]}/>
                            <hr/>
                            <HealthHistoryList camera={resource.items[0]}/>
                        </Container>
                    </ProvideResource>
                </>
            }
        </>
    );
}

function HealthHistory() {
    const { thingName } = useParams();

    useEffect(() => {
        ChartJS.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            Title,
            Tooltip,
            Legend
        );
        /*
        return () => {
            ChartJS.unregister(
                CategoryScale,
                LinearScale,
                PointElement,
                LineElement,
                Title,
                Tooltip,
                Legend
            )
        }
        */
    });

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