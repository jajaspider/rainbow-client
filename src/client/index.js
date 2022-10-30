const discordClient = require('./discord');
const kakaoClient = require('./kakao-remote');

class CLIENT {
    constructor() {
        this.discord = discordClient;
        this.kakao = kakaoClient;
    }
}

const client = new CLIENT();

module.exports = client;