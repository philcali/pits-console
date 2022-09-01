import BaseService from "./BaseService";
import { settings } from "../constants";

const ENDPOINT = settings.authEndpoint;
const CLIENT_ID = settings.clientId;

class AuthService extends BaseService {
    constructor(sessions) {
        super(ENDPOINT, sessions);
    }

    async userInfo() {
        return this.request('/oauth2/userInfo').then(resp => resp.json());
    }

    loginEndpoint(currentHost, from) {
        let params = [
            'response_type=token',
            `client_id=${CLIENT_ID}`,
            `redirect_uri=${currentHost}/login`,
        ];
        if (typeof from !== 'undefined') {
            params.push(`state=${from}`);
        }
        return `${this.endpoint}/oauth2/authorize?${params.join('&')}`;
    }

    logoutEndpoint(currentHost) {
        let params = [
            `client_id=${CLIENT_ID}`,
            `logout_uri=${currentHost}/logout`
        ];
        return `${this.endpoint}/logout?${params.join('&')}`;
    }
}

export default AuthService;
