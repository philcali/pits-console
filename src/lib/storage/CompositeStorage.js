import Storage from "./Storage";

class CompositeStorage extends Storage {
    constructor(storages) {
        super();
        this.storages = storages;
    }

    getItem(key, defaultValue) {
        let value = null;
        for (let index = 0; index < this.storages.length; index++) {
            let storage = this.storages[index];
            value = storage.getItem(key);
            if (value !== null) {
                break;
            }
        }
        return value || defaultValue;
    }

    putItem(key, value, expiresIn) {
        this.storages.forEach(storage => storage.putItem(key, value, expiresIn));
    }

    deleteItem(key) {
        this.storages.forEach(storage => storage.deleteItem(key));
    }
}

export default CompositeStorage;