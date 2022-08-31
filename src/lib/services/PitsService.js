import BaseService from "./BaseService";
import { settings } from "../constants";

const ENDPOINT = settings.serviceEndpoint;

class Resource extends BaseService {
    constructor(endpoint, sessions, name) {
        super(endpoint, sessions);
        this.name = name;
    }

    async throwOnError(response) {
        if (response < 200 || response >= 300) {
            let body = await response.json();
            throw Error(body.message);
        }
        return response;
    }

    async list(params) {
        let endpoint = this.name;
        if (params) {
            let query = [];
            for (let key in params) {
                if (params[key]) {
                    let values = params[key];
                    if (!Array.isArray(values)) {
                        values = [values];
                    }
                    values.forEach(value => {
                        query.push(`${key}=${encodeURIComponent(value)}`);
                    });
                }
            }
            if (query.length > 0) {
                endpoint += `?${query.join('&')}`;
            }
        }
        return this.request(`/${endpoint}`)
            .then(resp => resp.json());
    }

    async get(itemId) {
        return this.request(`/${this.name}/${itemId}`)
            .then(resp => resp.json());
    }

    async create(thing) {
        return this.request(`/${this.name}`, {
            method: 'POST',
            body: JSON.stringify(thing),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(this.throwOnError)
        .then(resp => {
            if (resp.headers.get('Content-Length') !== '0') {
                return resp.json();
            } else {
                return {};
            }
        });
    }

    async update(itemId, thing) {
        return this.request(`/${this.name}/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(thing),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(this.throwOnError)
        .then(resp => resp.json());
    }

    async delete(itemId) {
        return this.request(`/${this.name}/${itemId}`,{
                method: 'DELETE'
            })
            .then(this.throwOnError)
            .then(resp => resp.ok);
    }

    resource(id, name) {
        return new Resource(this.endpoint, this.sessions, `${this.name}/${id}/${name}`);
    }
}

class PitsService extends BaseService {
    constructor(sessions) {
        super(ENDPOINT, sessions);
    }

    resource(name) {
        return new Resource(this.endpoint, this.sessions, name);
    }

    async putConfiguration(configJson) {
        return this.request('/confiugrations/default', {
            method: 'PUT',
            body: JSON.stringify(configJson),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(resp => resp.json());
    }

    async getConfiguration() {
        return this.request('/configurations/default')
            .then(resp => {
                if (resp.status === 404) {
                    return {};
                }
                return resp.json();
            });
    }

    async imageCapture(thingName, timeout) {
        let startTime = Date.now();
        let globalTimeout = timeout || 15000;
        return new Promise((resolve, reject) => {
            this.startImageCapture(thingName)
            .then(capture => {
                let cleanup = () => clearInterval(pollingTimer);
                let pollingTimer = setInterval(() => {
                    if (Date.now() >= (startTime + (globalTimeout * 1000))) {
                        cleanup();
                        reject("Timer exceeded timeout limit");
                    } else {
                        this.getImageCaptureMetadata(thingName)
                            .then(response => {
                                if (response.ok || response.status === 404) {
                                    return response.json();
                                } else {
                                    cleanup();
                                    reject(response);
                                }
                            })
                            .then(json => {
                                if (json && new Date(json.lastModified).getTime() > startTime) {
                                    return this.getImageCaptureUrl(thingName)
                                        .then(image => {
                                            return {
                                                ...json,
                                                ...image
                                            };
                                        });
                                } else {
                                    return false;
                                }
                            })
                            .then(image => {
                                if (image !== false) {
                                    cleanup();
                                    resolve(image);
                                }
                            })
                    }
                }, 1000);
            });
        });
    }

    async startImageCapture(thingName) {
        return this.request(`/cameras/${thingName}/captureImage`, {
            method: 'POST',
            body: JSON.stringify('{}'),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(resp => resp.json());
    }

    async getImageCaptureMetadata(thingName) {
        return this.request(`/cameras/${thingName}/captureImage`);
    }

    async getImageCaptureUrl(thingName) {
        return this.request(`/cameras/${thingName}/captureImage/url`)
            .then(resp => resp.json());
    }

    async getVideoUrl(thingName, motionVideo) {
        return this.request(`/videos/${motionVideo}/cameras/${thingName}/url`)
            .then(resp => resp.json());
    }
}

['cameras', 'groups', 'videos', 'subscriptions'].forEach(resource => {
    PitsService.prototype[resource] = function name() {
        return this.resource(resource);
    };
});

PitsService.prototype['thingGroups'] = function thingGroups() {
    return this.resource('iot/groups');
}

export default PitsService;