
const SESS_CTX = 'pits_ses';
const AUTH_CTX = 'pits_acc'

class SessionStorage {
    constructor(storage) {
        this.storage = storage;
    }

    sessionToken() {
        return this.storage.getItem(SESS_CTX);
    }

    accessToken() {
        return this.storage.getItem(AUTH_CTX);
    }

    update(clientToken) {
        let expires = parseInt(clientToken['expires_in']);
        this.storage.putItem(SESS_CTX, clientToken['id_token'], expires);
        this.storage.putItem(AUTH_CTX, clientToken['access_token'], expires);
    }

    clear() {
        [SESS_CTX, AUTH_CTX].forEach(key => this.storage.deleteItem(key));
    }
}

export default SessionStorage;