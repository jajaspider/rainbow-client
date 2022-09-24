const _ = require('lodash');
const { Server, Message } = require('@remote-kakao/core');
const crypto = require("crypto");

const { chatEvent } = require('../core/eventBridge/index');

const server = new Server();
const socket = _.get(server, 'socket');

server.on('message', async (data) => {
    /*
    {
      channelId: '947436800941629510',
      userId: '404997570721480704',
      nickname: null,
      chat: '고생하셨습니당',
      client: 'discord'
    }
    */

    //방이름으로 전송하기때문에 channelId사용
    // userId는 username으로 대체
    // nickname또한 공통


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

server.on('sendMessage', (payload) => {
    // 데이터 전송에 필요한 객체는 payload에 포함시킨다.
    // room - 방 이름
    // text - 전송할 str
    // address,port
    /* 예상가능한 객체 구조
    {
        senderInfo: {
            address: 'ip',
            port: 'port',
            room: '방이름'
        },
        message: 'temptemp';
    }
    */
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
    const data = encodeURIComponent(JSON.stringify({ event: 'sendText', data: { room, text: message }, session }));
    socket.send(data, 0, data.length, port, address);
});

server.start(30004);

module.exports = server;
