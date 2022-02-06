// import {
//     AuthApiClient,
//     ChatBuilder,
//     KnownChatType,
//     MentionContent,
//     ReplyContent,
//     TalkClient
// } from 'node-kakao';

const nodeKakao = require('node-kakao');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const {
    router
} = require('./router');
const _ = require('lodash');
const mongoose = require('mongoose');
const {
    sleep
} = require("./utils");
const KakaoLink = require('kakao-link');


let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

let device = _.get(config, 'device');
let DEVICE_UUID = _.get(device, 'uuid');
let DEVICE_NAME = _.get(device, 'name');
let EMAIL = _.get(device, 'email');
let PASSWORD = _.get(device, 'password');

let mongo = _.get(config, 'mongo');
let mongoIp = _.get(mongo, 'ip');
let mongoPort = _.get(mongo, 'port');
let mongoDatabase = _.get(mongo, 'database');

mongoose
    .connect(`mongodb://${mongoIp}:${mongoPort}/${mongoDatabase}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Successfully connected to mongodb'))
    .catch(e => {
        console.error(e);
        throw new Error('mongo DB connection fail');
    });

const CLIENT = new nodeKakao.TalkClient();
let kakaoLink = null;
let kakaoLinkDate = null;
async function kakaoLogin() {
    try {
        kakaoLink = new KakaoLink('d662864eb6a3efa5a93c7cddb665b142', 'http://sonaapi.com');
        await kakaoLink.login('sonaapi17@gmail.com', 'maple.support');
        kakaoLinkDate = new Date().getDate();
    }
    catch (e) {
        console.dir(e);
        console.dir('로그인 실패');
    }
}

CLIENT.on('chat', async (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if (!sender) return;

    let resultList = await router(data, channel);

    for (let result of resultList) {
        let type = _.get(result, 'type');
        if (type == 'sendChat') {
            await channel.sendChat(_.get(result, 'result'));
            await sleep(1000);
        } else if (type == 'reply') {
            // 현재 동작하지않음 2021.01.16
            await channel.sendChat(
                new nodeKakao.ChatBuilder()
                    .append(new nodeKakao.ReplyContent(data.chat))
                    .text(_.get(result, 'result'))
                    .build(nodeKakao.KnownChatType.REPLY));
        } else if (type == 'kakaolink') {
            // 2021.02.06
            // 카링 재로그인 추가
            if (kakaoLinkDate != new Date().getDate()) {
                await kakaoLogin();
            }
            await kakaoLink.send(
                `${_.get(result, 'result.roomName')}`, {
                link_ver: '4.0',
                template_id: _.get(result, 'result.templateId'),
                template_args: _.get(result, 'result.templateArgs')
            },
                'custom'
            );
        }
    }

    // if (data.text === '안녕하세요') {
    //     // 답장 형식
    //     // 안녕하세요 @xxx
    //     channel.sendChat(
    //         new nodeKakao.ChatBuilder()
    //         .append(new nodeKakao.ReplyContent(data.chat))
    //         .text('안녕하세요 ')
    //         .append(new nodeKakao.MentionContent(sender))
    //         .build(nodeKakao.KnownChatType.REPLY));
    //     // 일반 텍스트
    //     // channel.sendChat('안녕하세요');
    // }
});

async function main() {
    const api = await nodeKakao.AuthApiClient.create(DEVICE_NAME, DEVICE_UUID);
    const loginRes = await api.login({
        email: EMAIL,
        password: PASSWORD,

        // This option force login even other devices are logon
        forced: true,
    });
    if (!loginRes.success) throw new Error(`Web login failed with status: ${loginRes.status}`);

    console.log(`Received access token: ${loginRes.result.accessToken}`);

    const res = await CLIENT.login(loginRes.result);
    if (!res.success) throw new Error(`Login failed with status: ${res.status}`);
    await kakaoLogin();
    console.log('Login success');
}

main().then();