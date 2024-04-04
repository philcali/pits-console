
function toDate(timestamp) {
    return new Date(timestamp * 1000);
}

function formatDate(timestamp) {
    return toDate(timestamp)
        .toLocaleDateString()
        .split("/")
        .map(n => n.length === 1 ? `0${n}` : n)
        .join('/')
}

function formatTime(timestamp) {
    return toDate(timestamp).toLocaleTimeString();
}

function parseSearchParams(params) {
    let elements = params.split('&');
    let response = {};
    elements.forEach(elem => {
        if (elem === '') {
            return;
        }
        let parts = elem.split('=');
        response[parts[0]] = decodeURIComponent(parts[1]);
    });
    return response;
}

function formatDuration(duration) {
    if (!duration) {
        return 'NA';
    }
    let seconds = duration;
    let minutes = Math.floor(duration / 60);
    if (minutes > 0) {
        return `${minutes} minutes, ${seconds % 60} seconds`;
    } else {
        return `${seconds} seconds`;
    }
}

export {
    formatDate,
    formatTime,
    formatDuration,
    parseSearchParams,
}