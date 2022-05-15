const nodeKakao = require('node-kakao');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const KakaoLink = require('kakao-link');

class KAKAOCLIENT {
    constructor() {
        // this.CLIENT = null;
        this.CLIENT = new nodeKakao.TalkClient();
        this.kakaoLink = null;
        this.kakaoLinkDate = null;
    }

    async init() {
        let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
        let config = yaml.load(fs.readFileSync(configPath));

        let device = _.get(config, 'device');
        let DEVICE_UUID = _.get(device, 'uuid');
        let DEVICE_NAME = _.get(device, 'name');
        let EMAIL = _.get(device, 'email');
        let PASSWORD = _.get(device, 'password');

        const api = await nodeKakao.AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
        const loginRes = await api.login({
            email: EMAIL,
            password: PASSWORD,

            // This option force login even other devices are logon
            forced: true,
        });
        if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

        console.log(`Received access token: ${loginRes.result.accessToken}`);

        const res = await this.CLIENT.login(loginRes.result);
        if (!res.success) throw new Error(`Login failed with status: ${res.status}`);
        await this.kakaoLogin();
        console.log('Login success');
    }

    async kakaoLogin() {
        try {
            this.kakaoLink = new KakaoLink('d662864eb6a3efa5a93c7cddb665b142', 'http://sonaapi.com');
            await this.kakaoLink.login('sonaapi17@gmail.com', 'maple.support');
            this.kakaoLinkDate = new Date().getDate();
        } catch (e) {
            console.dir(e);
            console.dir('로그인 실패');
        }
    }
}

const kakaoClient = new KAKAOCLIENT();
kakaoClient.init();
module.exports = kakaoClient;