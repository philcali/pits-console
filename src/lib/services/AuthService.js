import BaseService from "./BaseService";

const ENDPOINT = 'https://auth.pinthesky.com'
const CLIENT_ID = '71djrmpj409or4lks1sr9jh2i1';

class AuthService extends BaseService {
    constructor(sessions) {
        super(ENDPOINT, sessions);
    }

    async userInfo() {
        return this.request('/oauth2/userInfo').then(resp => resp.json());
    }

    loginEndpoint(currentHost) {
        let params = [
            'response_type=token',
            `client_id=${CLIENT_ID}`,
            `redirect_uri=${currentHost}/login`
        ];
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
