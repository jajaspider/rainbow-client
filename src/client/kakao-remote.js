const _ = require('lodash');
const {
    Server,
    Message
} = require('@remote-kakao/core');
const crypto = require("crypto");
// const KakaoLink = require('kakao-link');
// const KakaoLink = require('../utils/kakaoLink');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

let publishQueue = [];
let publishTime = new Date().getTime();

const {
    chatEvent
} = require('../core/eventBridge/index');

let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

class KAKAOCLIENT {
    constructor() {
        this.server = new Server();
        this.socket = _.get(this.server, 'socket');
        // this.kakaoLink = null;

        this.server.on('message', async (data) => {
            /*
            {
              channelId: '947436800941629510',
              userId: '404997570721480704',
              nickname: null,
              chat: '고생하셨습니당',
              client: 'discord'
            }
            */

            let channelId = _.get(data, 'room');
            let userId = _.get(data, 'sender.name');
            let nickname = _.get(data, 'sender.name');
            let chat = _.get(data, 'content');
            let senderInfo = {
                address: _.get(data, 'remoteInfo.address'),
                port: _.get(data, 'remoteInfo.port'),
                room: _.get(data, 'room'),
            }

            if (!_.get(data, 'isGroupChat')) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "사용불가",
                    senderInfo,
                    client: 'kakao-remote'
                });
                return;
            }

            const user = {
                channelId,
                userId,
                nickname,
                chat,
                client: 'kakao-remote',
                senderInfo
            };

            chatEvent.emit('receive', user);
        });

        this.server.on('sendMessage', (payload) => {
            console.dir({
                method: 'kakao-remote, sendMessage',
                payload
            }, {
                depth: null
            });

            let senderInfo = _.get(payload, 'senderInfo');

            let address = _.get(senderInfo, 'address');
            let port = _.get(senderInfo, 'port');
            let room = _.get(senderInfo, 'room');

            let message = _.get(payload, 'message');

            const session = (0, crypto.randomUUID)();
            const data = encodeURIComponent(JSON.stringify({
                event: 'sendText',
                data: {
                    room,
                    text: message
                },
                session
            }));
            this.socket.send(data, 0, data.length, port, address);
        });

        // 현재 카링 안됨
        this.server.on('sendKakaolink', async (payload) => {
            console.dir(payload, { depth: null });

            // // 2021.02 .06
            // // 카링 재로그인 추가
            // if (this.kakaoLinkDate != new Date().getDate()) {
            //     await this.kakaoLogin();
            // }

            // let channelId = _.get(payload, 'channelId');

            // // payload = _.get(payload, 'data');
            // let templateId = _.get(payload, 'data.templateId');
            // let templateArgs = _.get(payload, 'data.templateArgs');

            // await this.kakaoLink.send(
            //     `${channelId}`, {
            //     link_ver: '4.0',
            //     template_id: templateId,
            //     template_args: templateArgs
            // }, 'custom');

            // let next = _.get(payload, 'next');
            // if (next != null) {
            //     chatEvent.emit('send', {
            //         channelId,
            //         type: 'chat',
            //         data: next,
            //         client
            //     });
            // }
        });

        this.server.on('ready', (port) => {
            console.log(`server listen port:${port}`);
        })
    }

    async init() {
        this.server.start(30004);
        // await this.kakaoLogin();
    }

    // async kakaoLogin() {
    //     let javascriptKey = _.get(config, 'kakaoLink.javascriptKey');
    //     let domain = _.get(config, 'kakaoLink.domain');
    //     let email = _.get(config, 'kakaoLink.email');
    //     let password = _.get(config, 'kakaoLink.password');
    //     console.dir({
    //         javascriptKey, domain, email, password
    //     })

    //     try {
    //         this.kakaoLink = new KakaoLink(javascriptKey, domain);
    //         await this.kakaoLink.login(email, password);
    //         this.kakaoLinkDate = new Date().getDate();
    //     } catch (e) {
    //         console.dir(e);
    //         console.dir('로그인 실패');
    //     }
    // }
}

chatEvent.on('send', (payload) => {
    let client = _.get(payload, 'client');
    //kakao-remote가 아니면 처리할 필요없음
    if (client != 'kakao-remote') {
        return;
    }

    publishQueue.push(payload);
});

function queueManager() {
    if (!_.isEmpty(publishQueue)) {
        //큐에있는 데이터를 가져옴
        let originPayload = publishQueue.shift();

        //그리고 해당 방에다가 마지막으로 publish한 시간을 체크
        let channelId = _.get(originPayload, 'channelId');

        //기존에 퍼블리시한 시간과 1초이상 차이나는지 확인
        if ((new Date().getTime() - publishTime) >= 1000) {
            const type = _.get(originPayload, 'type');
            // 일반 str형태 chat
            if (type === 'chat') {
                let senderInfo = _.get(originPayload, 'senderInfo');
                if (!senderInfo) {
                    senderInfo = {
                        address: '192.168.1.152',
                        port: 43044,
                        room: channelId
                    }
                }
                let message = _.get(originPayload, 'data');

                kakaoClient.server.emit('sendMessage', {
                    senderInfo,
                    message
                });
            }
            else if (type === 'kakaolink') {
                kakaoClient.server.emit('sendKakaolink', {
                    originPayload
                })
            }

            //마지막으로 publish한 시간 기록
            // _.set(publishManager, channelId, {
            //     date: new Date().getTime()
            // });
            publishTime = new Date().getTime();
        }
        // 차이가 안난다면
        else {
            publishQueue.push(originPayload);
        }
    }

    setTimeout(() => {
        queueManager();
    }, 100);
}

queueManager();

const kakaoClient = new KAKAOCLIENT();
kakaoClient.init();

module.exports = kakaoClient;