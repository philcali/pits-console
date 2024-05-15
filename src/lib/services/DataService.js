import { settings } from "../constants";

const ENDPOINT = settings.dataEndpoint;

class SocketConnection {

    constructor(socket, connectionId) {
        this.connectionId = connectionId;
        this.socket = socket;
        this.invocations = [];
        this.requests = [];
        this.errors = [];

        this.socket.addEventListener('message', event => {
            const response = JSON.parse(event.data);
            if ('invoke' in response) {
                this.invocations.forEach(invoke => {
                    invoke(response['invoke']);
                });
            } else if ('response' in response) {
                if (response.response.statusCode === 200) {
                    this.requests.forEach(request => {
                        request(response.response);
                    });
                } else {
                    this.errors.forEach(error => {
                        error(response.response.error);
                    });
                }
            }
        });
    }

    onInvoke(callback) {
        this.invocations.push(callback);
    }

    offInvoke(callback) {
        this.invocations = this.invocations.filter(f => f !== callback);
    }

    onRequest(onSuccess, onError) {
        this.requests.push(onSuccess);
        if (onError !== undefined) {
            this.errors.push(onError);
        }
    }

    offRequest(onSuccess, onError) {
        this.requests = this.requests.filter(f => f !== onSuccess);
        if (onError !== undefined) {
            this.errors = this.errors.filter(f => f !== onError);
        }
    }

    send(action, payload) {
        this.socket.send(JSON.stringify({
            action,
            payload,
        }))
    }

    status() {
        switch (this.socket.readyState) {
            case WebSocket.OPEN:
                return 'OPEN';
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'CLOSED';
            default:
                throw new Error(`Unknown state ${this.socket.readyState}`);
        }
    }

    isOpen() {
        return this.status() === 'OPEN';        
    }

    close() {
        this.socket.close();
    }

    static async create(jwtId, controlPlane, manager=undefined) {
        // Start the exhange
        const token = await controlPlane.tokens().create({});
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(ENDPOINT, manager === undefined ? 'manager' : 'session');

            const handleError = event => {
                socket.removeEventListener('error', handleError);
                reject(event.data);
            };
            socket.addEventListener('error', handleError);

            const handleLogin = event => {
                // We're done with the login, resolve or reject
                (manager === undefined ? socket : manager).removeEventListener('message', handleLogin);
                const data = JSON.parse(event.data);
                if (data.response.statusCode === 200) {
                    resolve(new SocketConnection(
                        socket,
                        data.response.body.connectionId,
                    ));
                } else {
                    reject(new Error(data.response.error.message));
                }
            };

            (manager === undefined ? socket : manager).addEventListener('message', handleLogin);
            socket.addEventListener('open', () => {
                // On connection, initiate a login from token exchange
                socket.send(JSON.stringify({
                    action: 'login',
                    payload: {
                        tokenId: token.id,
                        managerId: manager !== undefined ? manager.connectionId : null,
                        jwtId,
                    }
                }));
            });
        });
    }
}

['invoke', 'listSessions'].forEach(action => {
    SocketConnection.prototype[action] = function send(payload) {
        return this.send(action, payload);
    };
})

class DataService {
    constructor(sessions, controlPlane) {
        this.sessions = sessions;
        this.controlPlane = controlPlane;
    }

    async manager() {
        return await SocketConnection.create(
            this.sessions.sessionToken(),
            this.controlPlane,
        );
    }

    async session(manager) {
        return await SocketConnection.create(
            this.sessions.sessionToken(),
            this.controlPlane,
            manager,
        );
    }

}

export default DataService;