import { useState } from "react";
import { pitsService } from "../../lib/services";
import { useAlerts } from "../notifications/AlertContext";
import { ResourceContext } from "./ResourceContext";

function useResource(res, additionalParams, manuallyPage) {
    const alerts = useAlerts();
    const [ resource, setResource ] = useState(res);
    const [ content, setContent ] = useState({
        items: [],
        loading: true,
        additionalParams,
        nextToken: null
    });

    let api = resource || res;
    if (typeof api === 'string') {
        api = pitsService[api]();
    }

    if (content.loading) {
        let params = {
            ...(content.additionalParams || {}),
            nextToken: content.nextToken
        };
        api.list(params)
            .then(resp => {
                let loading = 'nextToken' in resp && resp.nextToken !== null;
                if (loading && manuallyPage === true) {
                    loading = false;
                }
                setContent({
                    ...content,
                    items: content.items.concat(resp.items),
                    nextToken: resp.nextToken,
                    loading
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

    const reload = (newParams) => {
        setContent({
            items: [],
            loading: true,
            nextToken: null,
            additionalParams: newParams || content.additionalParams
        });
    };

    const nextPage = () => {
        setContent({
            ...content,
            loading: true,
        })
    };

    return {
        ...content,
        api,
        name: api.name,
        nextPage,
        reload,
        setResource
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