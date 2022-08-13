import Storage from "./Storage";

class LocalStorage extends Storage {
    getItem(key, defaultValue) {
        let entry = localStorage.getItem(key);
        if (entry === null) {
            return defaultValue || null;
        }
        let parsedEntry = JSON.parse(entry);
        if (parsedEntry.expiration <= Date.now()) {
            this.deleteItem(key);
            return defaultValue || null;
        }
        return parsedEntry.value;
    }

    putItem(key, value, expiresIn) {
        let entry = { value };
        if (typeof expiresIn !== 'undefined') {
            entry.expiration = Date.now() + (expiresIn * 1000);
        }
        localStorage.setItem(key, JSON.stringify(entry));
    }

    deleteItem(key) {
        localStorage.removeItem(key);
    }
}

export default LocalStorage;