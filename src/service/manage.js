const _ = require("lodash");
const axios = require("axios");
const Permission = require("../models/index").Permission;
const async = require("async");
const {
    chatEvent
} = require('../core/eventBridge');

async function exec(methodObj, chat, channelId, attachmentId, client) {
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;

    switch (command) {
        case "roomRegister":
            if (chatLength >= 2) {
                return;
            }
            let type = null;
            if (chat == '메이플' || chat == '메이플스토리') {
                type = 'maplestory';
            } else if (chat == '로아' || chat == '로스트아크') {
                type = 'lostark';
            }

            let result = await Permission.find({
                id: channelId,
                type

            }).lean();

            if (_.isEmpty(result)) {
                try {
                    await Permission.insertMany({
                        id: channelId,
                        type
                    });
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "추가 성공",
                        client
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "추가 성공",
                    // };
                } catch (e) {
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "추가 실패",
                        client
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "추가 실패",
                    // };
                }

            } else {
                try {
                    await Permission.remove({
                        id: channelId,
                        type
                    });
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "삭제 성공",
                        client
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "삭제 성공",
                    // };
                } catch (e) {
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "삭제 실패",
                        client
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "삭제 실패",
                    // };
                }
            }
            break;
        case 'emoticon':
            // attachmentId
            chatEvent.emit('saveImage', {
                channelId,
                chat,
                attachmentId,
                client
            });
            break;
        case 'deleteEmoticon':
            chatEvent.emit('deleteImage', {
                channelId,
                chat,
                attachmentId,
                client
            });
            break;

    }
}

module.exports = {
    exec,
};