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

    console.log('Login success');
}

main().then();