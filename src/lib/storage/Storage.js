
function notImplemented() {
    throw new Error("Not Implemented");
}

class Storage {
    getItem(key, defaultValue) {
        notImplemented();
    }

    putItem(key, value, expiresIn) {
        notImplemented();
    }

    deleteItem(key) {
        notImplemented();
    }
}

export default Storage;