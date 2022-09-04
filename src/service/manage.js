const _ = require("lodash");
const axios = require("axios");
const Permission = require("../models/index").Permission;
const {
    chatEvent
} = require('../core/eventBridge');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

async function exec(methodObj, chat, channelId, attachmentId, client) {
    let command = _.get(methodObj, "name");
    let reg = /(?:[^\s"]+|"[^"]*")+/g;
    let chatSplit = chat.match(reg);
    let chatLength = chatSplit.length;
    let response = null;
    let responseData = null;
    let errorMessage = null;
    let url = null;
    let apiEndpoint = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0`;

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
        case 'registerBoss':
            if (chatSplit.length != 3) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }
            let registerPayload = {
                game: chatSplit[0],
                name: chatSplit[1],
                level: chatSplit[2]
            };

            if (registerPayload.game == '로아' || registerPayload.game == '로스트아크') {
                registerPayload.game = 'lostark'
            }
            else if (registerPayload.game == '메이플' || registerPayload.game == '메이플스토리') {
                registerPayload.game = 'maplestory'
            }
            else {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }

            response = await axios.post(`${apiEndpoint}/boss/register`, registerPayload);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage,
                    client
                });
                return;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '등록 완료',
                client
            });
            return;
            break;
        case 'editMoney':
            if (chatSplit.length != 3) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }
            let editMoneyPayload = {
                name: chatSplit[0],
                level: chatSplit[1],
                money: chatSplit[2]
            };
            try {
                editMoneyPayload.money = Number.parseInt(editMoneyPayload.money);
            }
            catch (e) {
                console.dir(e);
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }

            response = await axios.put(`${apiEndpoint}/boss/money`, editMoneyPayload);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage,
                    client
                });
                return;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '수정 완료',
                client
            });
            return;
            break;
        case 'insertReward':
            if (chatSplit.length != 3) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }
            let insertRewardPayload = {
                name: chatSplit[0],
                level: chatSplit[1],
                reward: chatSplit[2]
            };
            try {
                insertRewardPayload.reward = JSON.parse(insertRewardPayload.reward);
            }
            catch (e) {
                // console.dir(e);
            }

            response = await axios.put(`${apiEndpoint}/boss/reward`, insertRewardPayload);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage,
                    client
                });
                return;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '추가 완료',
                client
            });
            return;
            break;
        case 'editReward':
            if (chatSplit.length != 4) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못 입력하셨습니다.",
                    client
                });
                return;
            }
            let editRewardPayload = {
                name: chatSplit[0],
                level: chatSplit[1],
                prev: chatSplit[2],
                curr: chatSplit[3]
            };
            try {
                editRewardPayload.prev = JSON.parse(editRewardPayload.prev);
                editRewardPayload.curr = JSON.parse(editRewardPayload.curr);
            }
            catch (e) {
                // console.dir(e);
            }

            response = await axios.put(`${apiEndpoint}/boss/reward`, editRewardPayload);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage,
                    client
                });
                return;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '수정 완료',
                client
            });
            return;
            break;
        // case 'deleteReward':
        //     if (chatSplit.length != 3) {
        //         chatEvent.emit('send', {
        //             channelId,
        //             type: 'chat',
        //             data: "잘못 입력하셨습니다.",
        //             client
        //         });
        //         return;
        //     }

        //     let game = chatSplit[0];
        //     let name = chatSplit[1];

        //     try {
        //         deleteRewardPayload.reward = JSON.parse(deleteRewardPayload.reward);
        //     }
        //     catch (e) {
        //         // console.dir(e);
        //     }

        //     response = await axios.put(`${apiEndpoint}/boss/reward`, deleteRewardPayload);
        //     if (response.status != 200) {
        //         return;
        //     }
        //     responseData = _.get(response, "data");
        //     errorMessage = _.get(responseData, 'payload.message');
        //     if (errorMessage) {
        //         chatEvent.emit('send', {
        //             channelId,
        //             type: 'chat',
        //             data: errorMessage,
        //             client
        //         });
        //         return;
        //     }

        //     chatEvent.emit('send', {
        //         channelId,
        //         type: 'chat',
        //         data: '추가 완료',
        //         client
        //     });
        //     return;
        //     break;
        default:
            break;
    }
}

module.exports = {
    exec,
};