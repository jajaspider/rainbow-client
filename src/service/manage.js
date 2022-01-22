const _ = require("lodash");
const axios = require("axios");
const Permission = require("../models/index").Permission;
const async = require("async");

async function exec(methodObj, chat, channel) {
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

    let roomNumber = _.get(channel, "_channel.channelId").toString();
    switch (command) {
        case "roomRegister":
            let result = await Permission.find({
                id: roomNumber,
                type

            }).lean();

            if (_.isEmpty(result)) {
                try {
                    await Permission.insertMany({
                        id: roomNumber,
                        type
                    });
                    return {
                        type: "sendChat",
                        result: "추가 성공",
                    };
                } catch (e) {
                    return {
                        type: "sendChat",
                        result: "추가 실패",
                    };
                }

            } else {
                try {
                    await Permission.remove({
                        id: roomNumber,
                        type
                    });
                    return {
                        type: "sendChat",
                        result: "삭제 성공",
                    };
                } catch (e) {
                    return {
                        type: "sendChat",
                        result: "삭제 실패",
                    };
                }
            }
            break;
    }
}

module.exports = {
    exec,
};