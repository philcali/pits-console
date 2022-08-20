import { Link } from "react-router-dom";
import ResourceList from "../../../components/resource/ResourceList";

function Videos() {
    const columns = [
        {
            label: "Video",
            format: (item) => item.motionVideo
        },
        {
            label: 'Camera',
            format: (item) => {
                return <Link to={`/account/cameras/${item.thingName}/configuration`}>{item.thingName}</Link>
            }
        }
    ];

    return (
        <ResourceList
            resource="videos"
            resourceTitle="Motion Video"
            resourceId="motionVideo"
            create={false}
            columns={columns}
        />
    )
}

export default Videos;