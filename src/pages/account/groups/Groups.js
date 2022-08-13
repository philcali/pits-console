import ResourceList from "../../../components/resource/ResourceList";

function Groups() {
    const columns = [
        {
            label: 'Name',
            format: (item) => item.name
        }
    ];

    return (
        <ResourceList
            resource="groups"
            resourceTitle="Group"
            resourceId="name"
            columns={columns}
        />
    );
}

export default Groups;