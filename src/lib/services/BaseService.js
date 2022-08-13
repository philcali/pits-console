
class BaseService {
    constructor(endpoint, sessions) {
        this.endpoint = endpoint;
        this.sessions = sessions;
    }

    authorization(additionalHeaders) {
        return {
            mode: 'cors',
            credentials: 'include',
            headers: {
                ...(additionalHeaders || {}),
                'Authorization': `Bearer ${this.sessions.accessToken()}`
            }
        };
    }

    async request(path, params) {
        let additionalParams = params || {};
        let headers = (additionalParams.headers || {});
        return fetch(`${this.endpoint}${path}`, {
            ...additionalParams,
            ...this.authorization(headers || {})
        });
    }
}

export default BaseService;