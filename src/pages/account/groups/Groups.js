import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import ResourceList from "../../../components/resource/ResourceList";

function Groups() {
    const columns = [
        {
            label: 'Name',
            format: (item) => item.name
        }
    ];

    return (
        <>
            <AccountBreadcrumb/>
            <ResourceList
                resource="groups"
                resourceTitle="Group"
                resourceId="name"
                columns={columns}
            />
        </>
    );
}

export default Groups;