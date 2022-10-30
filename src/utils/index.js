function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time)
    });
}

function toJson(data) {
    return JSON.parse(JSON.stringify(data));
}

module.exports = {
    sleep: sleep,
    toJson
};