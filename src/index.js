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
const rabbitmq = require('./core/rabbitmq');
const {
    chatEvent
} = require('./core/eventBridge');
// const mqService = require('./service/mqService');


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

let CLIENT = null;
CLIENT = new nodeKakao.TalkClient();
let kakaoLink = null;
let kakaoLinkDate = null;
async function kakaoLogin() {
    try {
        kakaoLink = new KakaoLink('d662864eb6a3efa5a93c7cddb665b142', 'http://sonaapi.com');
        await kakaoLink.login('sonaapi17@gmail.com', 'maple.support');
        kakaoLinkDate = new Date().getDate();
    } catch (e) {
        console.dir(e);
        console.dir('로그인 실패');
    }
}

chatEvent.on('send', async (payload) => {
    /*
        chatEvent.emit('send', {
            channelId,
            type: 'chat',
            data: "추가 성공"
        }); 
    */
    // if (CLIENT == null) {
    //     setTimeout(() => {
    //         chatEvent.emit('send', payload);
    //     }, 1000);
    //     return;
    // }
    console.dir(payload);
    try {


        let channelId = _.get(payload, 'channelId');

        // 채널 이름 = channel.info.openLink.linkName;
        let channel = CLIENT.channelList._open._map.get(channelId);
        const type = _.get(payload, 'type');
        if (type === 'chat') {
            let chat = _.get(payload, 'data');
            let result = await channel.sendChat(chat);
            if (!result.success) {
                setTimeout(() => {
                    chatEvent.emit('send', payload);
                }, 1000);
            }
        } else if (type === 'kakaolink') {
            // 2021.02 .06
            // 카링 재로그인 추가
            if (kakaoLinkDate != new Date().getDate()) {
                await kakaoLogin();
            }

            payload = _.get(payload, 'data');
            let templateId = _.get(payload, 'templateId');
            let templateArgs = _.get(payload, 'templateArgs');
            await kakaoLink.send(
                `${channel.info.openLink.linkName}`, {
                    link_ver: '4.0',
                    template_id: templateId,
                    template_args: templateArgs
                },
                'custom'
            );
        }
    } catch (e) {
        setTimeout(() => {
            chatEvent.emit('send', payload);
        }, 1000);
    }
})

CLIENT.on('chat', async (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if (!sender) return;

    let channelId = _.get(channel, "_channel.channelId").toString();
    let userId = null;
    try {
        userId = _.get(sender, 'linkId').toString();
    } catch (e) {
        // 오픈 프로필이 아니라면 userNumber는 null상태 유지
    }

    let nickname = _.get(sender, "nickname");
    let chat = data.text;

    let user = {
        channelId,
        userId,
        nickname,
        chat
    };

    chatEvent.emit('receive', user);

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