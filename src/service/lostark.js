const _ = require("lodash");
const axios = require("axios");
const Lostark = require("../models/index").Lostark;
const async = require("async");
const {
    chatEvent
} = require('../core/eventBridge');
const COMPRES = "\u200b".repeat(500);
const imageService = require('./imageService');

async function exec(methodObj, chat, nickname, channelId) {
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;
    let response = null;
    let responseData = null;
    let errorMessage = null;
    let url = null;
    switch (command) {
        case "help":
            let maplestoryMethods = await Lostark.find({}).lean();

            let result = `[로스트아크 명령어]${COMPRES}`;
            try {
                await async.mapLimit(maplestoryMethods, 5, async (methods) => {
                    let method = _.get(methods, "method");
                    let alias = _.get(methods, "alias");
                    let description = _.get(methods, "description");
                    result += `\n\n명령어 : ${method}\n대체 명령어 : ${alias}\n설명 : ${description}`;
                });
            } catch (e) {
                console.dir(e);
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: result
            });
            break;
        // return {
        //     type: "sendChat",
        //         result,
        // };
        case 'info':
            if (chat == '') {
                url = `http://localhost:30003/v0/lostark/info/${encodeURIComponent(nickname)}`;
            } else if (chatLength == 1) {
                url = `http://localhost:30003/v0/lostark/info/${encodeURIComponent(chat)}`;
            }
            response = await axios.get(url);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage
                });
                return;
                // return {
                //     type: "sendChat",
                //     result: errorMessage,
                // }
            }

            let character = _.get(responseData, 'payload.character');
            let server = _.get(character, 'server');
            // let nickname = _.get(character, 'nickname');
            let job = _.get(character, 'job');
            let fightLevel = _.get(character, 'fightLevel');
            let itemLevel = _.get(character, 'itemLevel');
            let attack = _.get(character, 'attack');
            let health = _.get(character, 'health');
            let specificList = _.get(character, 'specificList');
            let guildName = _.get(character, 'guildName');
            let engraveList = _.get(character, 'engraveList');
            let cardList = _.get(character, 'cardList');

            let info = `${nickname} - ${server} | ${job}\n`;
            info += `전투레벨 : ${fightLevel}\n`;
            info += `아이템레벨 : ${itemLevel}\n`;
            info += `공격력 : ${attack}\n`;
            info += `생명력 : ${health}\n`;
            info += `길드 : ${guildName}\n\n`;

            for (let specific of specificList) {
                info += `${specific.specificName}(${specific.specificValue}) `;
            }
            info += `\n\n`;

            for (let engrave of engraveList) {
                info += `${engrave}\n`;
            }
            // result += `\n`;

            for (let card of cardList) {
                info += `\n${card.cardSet} | ${card.cardSetValue}`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: info
            });
            break;
        // return {
        //     type: "sendChat",
        //         result: info,
        // };

        case "crystal":
            response = await axios.get(`http://localhost:30003/v0/lostark/crystal`);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage
                });
                return;

                // return {
                //     type: "sendChat",
                //     result: errorMessage,
                // }
            }
            let crystal = _.get(responseData, 'payload.result');

            let crystalInfo = `[크리스탈 시세]\n`
            crystalInfo += `사실때 : ${_.get(crystal, 'buyPrice')}\n`;
            crystalInfo += `파실때 : ${_.get(crystal, 'sellPrice')}\n`;
            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: crystalInfo
            });
            // return {
            //     type: "sendChat",
            //         result: crystalInfo,
            // };
            break;
        case "expand":
            if (chat == '') {
                url = `http://localhost:30003/v0/lostark/expand/${encodeURIComponent(nickname)}`;
            } else if (chatLength == 1) {
                url = `http://localhost:30003/v0/lostark/expand/${encodeURIComponent(chat)}`;
            }
            response = await axios.get(url);
            if (response.status != 200) {
                return;
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: errorMessage
                });
                return;
                // return {
                //     type: "sendChat",
                //     result: errorMessage,
                // }
            }
            let expandList = _.get(responseData, 'payload.result');

            let expandInfo = `[보유 캐릭터 정보]\n`

            for (let expand of expandList) {
                expandInfo += `${_.get(expand, 'server')} : ${_.get(expand, 'characterList')}\n`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: expandInfo
            });
            break;
        // return {
        //     type: "sendChat",
        //         result: expandInfo,
        // };
        case "emoticon":
            let images = imageService.getImage('lostark');
            let emoticonList = `[로스트아크 이모티콘]${COMPRES}`;
            for (let image of images) {
                emoticonList += `\n${image.name}`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: emoticonList
            });
            break;


        default:
            break;
    }
}

module.exports = {
    exec,
};