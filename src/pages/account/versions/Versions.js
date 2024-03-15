import AccountBreadcrumb from "../../../components/common/AccountBreadcrumb";
import ResourceList from "../../../components/resource/ResourceList";

const URL = "https://github.com/philcali/pits-device/tree"

function Versions() {
    const columns = [
        {
            label: 'Tag',
            format: item => {
                return (
                    <>
                        <a style={{ textDecoration: 'auto' }} rel="noreferrer" target="_blank" href={`${URL}/${item.name}#pi-in-the-sky---device`}>{item.name}</a>
                    </>
                );
            }
        },
        {
            label: 'Commit',
            format: item => item.commit.sha
        }
    ];

    const actions = [
        {
            icon: 'box-arrow-up-right',
            variant: 'outline-primary',
            onClick: item => {
                return () => {
                    window.open(`${URL}/${item.name}#pi-in-the-sky---device`, '_blank', "noreferrer=yes");
                }
            }
        }
    ]

    return (
        <>
            <AccountBreadcrumb/>
            <ResourceList
                resource="versions"
                resourceTitle="Software Version"
                resourceId="name"
                columns={columns}
                create={false}
                pagination={10}
                actions={actions}
                manuallyPage={true}
                disableDelete={true}
                disableMutate={true}
            />
        </>
    )
}

export default Versions;