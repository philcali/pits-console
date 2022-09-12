import { useState } from "react";
import { pitsService } from "../../lib/services";
import { useAlerts } from "../notifications/AlertContext";
import { ResourceContext } from "./ResourceContext";

function useResource(resource, additionalParams, manuallyPage) {
    const alerts = useAlerts();
    const [ content, setContent ] = useState({
        items: [],
        loading: true,
        additionalParams,
        nextToken: null
    });

    let api = resource;
    if (typeof resource === 'string') {
        api = pitsService[resource]();
    }

    if (content.loading) {
        let params = {
            ...(content.additionalParams || {}),
            nextToken: content.nextToken
        };
        api.list(params)
            .then(resp => {
                setContent({
                    ...content,
                    items: content.items.concat(resp.items),
                    nextToken: resp.nextToken,
                    loading: manuallyPage === false && typeof resp.nextToken === 'string'
                });
            })
            .catch(e => {
                alerts.error(`Failed to load ${api.name}: ${e.message}`);
                setContent({
                    ...content,
                    loading: false
                });
            });
    }

    const reload = () => {
        setContent({
            items: [],
            loading: true,
            nextToken: null,
            additionalParams
        });
    }

    return {
        ...content,
        api,
        name: api.name,
        reload
    };
}

function ProvideResource({ resource: name, manuallyPage, additionalParams, children }) {
    let defaultPaging = typeof manuallyPage === 'undefined' ? false : manuallyPage;
    const resource = useResource(name, additionalParams, defaultPaging);
    return (
        <ResourceContext.Provider value={resource}>
            { children }
        </ResourceContext.Provider>
    );
}

export default ProvideResource;