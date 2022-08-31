
class BaseService {
    constructor(endpoint, sessions) {
        this.endpoint = endpoint;
        this.sessions = sessions;
        this.responseFilter = null;
    }

    authorization(additionalHeaders) {
        return {
            mode: 'cors',
            headers: {
                ...(additionalHeaders || {}),
                'Authorization': `Bearer ${this.sessions.accessToken()}`
            }
        };
    }

    addResponseFilter(filter) {
        this.responseFilter = filter;
        return this;
    }

    async request(path, params) {
        let additionalParams = params || {};
        let headers = (additionalParams.headers || {});
        return fetch(`${this.endpoint}${path}`, {
            ...additionalParams,
            ...this.authorization(headers || {})
        })
        .then(resp => {
            if (this.responseFilter && this.responseFilter.check(resp)) {
                return this.responseFilter.filter(resp);
            }
            return resp;
        });
    }
}

export default BaseService;