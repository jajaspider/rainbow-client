const _ = require('lodash');
const {
    Server,
    Message
} = require('@remote-kakao/core');
const crypto = require("crypto");

const {
    chatEvent
} = require('../core/eventBridge/index');

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
    socket.send(data, 0, data.length, port, address);
});

server.start(30004);

module.exports = server;