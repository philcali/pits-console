import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import ResourceList from "../../../components/resource/ResourceList";

function Tags() {
    const columns = [
        {
            label: 'Name',
            format: item => item.name
        }
    ];

    return (
        <>
            <AccountBreadcrumb/>
            <ResourceList
                resource="tags"
                resourceTitle="Tag"
                resourceId="name"
                columns={columns}
            />
        </>
    )
}

export default Tags;