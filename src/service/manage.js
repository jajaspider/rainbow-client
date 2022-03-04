const _ = require("lodash");
const axios = require("axios");
const Permission = require("../models/index").Permission;
const async = require("async");
const {
    chatEvent
} = require('../core/eventBridge');

async function exec(methodObj, chat, channelId) {
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;
    if (chatLength >= 2) {
        return;
    }

    let type = null;
    if (chat == '메이플' || chat == '메이플스토리') {
        type = 'maplestory';
    } else if (chat == '로아' || chat == '로스트아크') {
        type = 'lostark';
    }

    switch (command) {
        case "roomRegister":
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
                        data: "추가 성공"
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "추가 성공",
                    // };
                } catch (e) {
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "추가 실패"
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
                        data: "삭제 성공"
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "삭제 성공",
                    // };
                } catch (e) {
                    chatEvent.emit('send', {
                        channelId,
                        type: 'chat',
                        data: "삭제 실패"
                    });
                    // return {
                    //     type: "sendChat",
                    //     result: "삭제 실패",
                    // };
                }
            }
            break;
    }
}

module.exports = {
    exec,
};