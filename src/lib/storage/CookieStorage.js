import Storage from "./Storage";

class CookieStorage extends Storage {
    getItem(key, defaultValue) {
        let cookies = document.cookie.split(/;\s*/);
        for (let index = 0; index < cookies.length; index++) {
            let parts = cookies[index].split('=');
            if (parts[0] === key) {
                return parts.slice(1).join('=');
            }
        }
        return defaultValue || null;
    }

    putItem(key, value, expiresIn) {
        let cookieValues = [`${key}=${value}`];
        if (typeof expiresIn !== 'undefined') {
            let now = Date.now();
            let expires = new Date(now + (expiresIn * 1000));
            cookieValues.push(`expires=${expires.toUTCString()}`);
        }
        document.cookie = cookieValues.join('; ');
    }

    deleteItem(key) {
        this.putItem(key, '', 0);
    }
}

export default CookieStorage;