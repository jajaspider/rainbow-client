const _ = require("lodash");
const axios = require("axios");
const Lostark = require("../models/index").Lostark;
const async = require("async");
const {
    chatEvent
} = require('../core/eventBridge');
const COMPRES = "\u200b".repeat(500);
const imageService = require('./imageService');
const rainbowUtil = require('../utils');

async function exec(methodObj, chat, nickname, channelId, client) {
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;
    let response = null;
    let responseData = null;
    let errorMessage = null;
    let url = null;
    switch (command) {
        case "help":
            let lostarkMethods = await Lostark.find({}).lean();

            let result = `[로스트아크 명령어]${COMPRES}`;
            try {
                await async.mapLimit(lostarkMethods, 5, async (methods) => {
                    let method = _.get(methods, "method");
                    let alias = _.get(methods, "alias");
                    let description = _.get(methods, "description");
                    result += `\n\n명령어 : ${method}\n대체 명령어 : ${alias}\n설명 : ${description}`;
                });
            } catch (e) {
                // console.dir(e);
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: result,
                client
            });
            break;
        case 'info':
            if (chat == '') {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/info/${encodeURIComponent(nickname)}`;
            } else if (chatLength == 1) {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/info/${encodeURIComponent(chat)}`;
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
                    data: errorMessage,
                    client
                });
                return;
            }

            let character = _.get(responseData, 'payload.character');
            let server = _.get(character, 'server');
            let nickName = _.get(character, 'nickname');
            let job = _.get(character, 'job');
            let fightLevel = _.get(character, 'fightLevel');
            let itemLevel = _.get(character, 'itemLevel');
            let attack = _.get(character, 'attack');
            let health = _.get(character, 'health');
            let specificList = _.get(character, 'specificList');
            let guildName = _.get(character, 'guildName');
            let engraveList = _.get(character, 'engraveList');
            let cardList = _.get(character, 'cardList');

            let info = `${nickName} - ${server} | ${job}\n`;
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
                data: info,
                client
            });
            break;

        case "crystal":
            response = await axios.get(`${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/crystal`);
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
            let crystal = _.get(responseData, 'payload.result');

            let crystalInfo = `[크리스탈 시세]\n`
            crystalInfo += `사실때 : ${_.get(crystal, 'buyPrice')}\n`;
            crystalInfo += `파실때 : ${_.get(crystal, 'sellPrice')}\n`;
            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: crystalInfo,
                client
            });
            break;
        case "expand":
            if (chat == '') {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/expand/${encodeURIComponent(nickname)}`;
            } else if (chatLength == 1) {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/expand/${encodeURIComponent(chat)}`;
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
                    data: errorMessage,
                    client
                });
                return;
            }
            let expandList = _.get(responseData, 'payload.result');

            let expandInfo = `[보유 캐릭터 정보]\n`

            for (let expand of expandList) {
                expandInfo += `${_.get(expand, 'server')} : ${_.get(expand, 'characterList')}\n`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: expandInfo,
                client
            });
            break;
        case "emoticon":
            let images = imageService.getImage('lostark');
            let emoticonList = `[로스트아크 이모티콘]\n${COMPRES}`;
            for (let image of images) {
                emoticonList += `\n${image.name}`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: emoticonList,
                client
            });
            break;
        case "eventList":
            url = `http://127.0.0.1:30003/v0/lostark/event`

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
                    data: errorMessage,
                    client
                });
                return;
                // return {
                //     type: "sendChat",
                //     result: errorMessage,
                // }
            }
            let eventList = _.get(responseData, 'payload.events');

            templateArgs = {};
            for (let i = 0; i < (eventList.length <= 5 ? eventList.length : 5); i += 1) {
                templateArgs[`event_name_${i + 1}`] = eventList[i].title;
                let term = (eventList[i].term).replace('이벤트 기간 : ', '')
                templateArgs[`event_contents_${i + 1}`] = term;
                templateArgs[`event_image_${i + 1}`] = eventList[i].img_path;
                templateArgs[`url${i + 1}`] = eventList[i].link;
            }

            templateId = 78643;

            let nextMessage = null;
            if (eventList.length > 5) {
                await rainbowUtil.sleep(1000);
                nextMessage = `나머지 ${eventList.length - 5}개 이벤트\n${COMPRES}`;
                for (let i = 5; i < eventList.length; i += 1) {
                    nextMessage += `\n\n${eventList[i].title}`;
                    nextMessage += `\nhttps://maplestory.nexon.com${eventList[i].link}`;
                    nextMessage += `\n${eventList[i].date}`;
                }
                // 각각의 타입이 정식 지원이되면 해당하는 send는 한개로 합쳐도 상관없음
                // if (client == 'kakao') {
                //     chatEvent.emit('send', {
                //         channelId,
                //         type: 'chat',
                //         data: message,
                //         client
                //     });
                // } else if (client == 'discord') {
                //     // 현재는 skip
                // }
            }

            if (client == 'kakao') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'kakaolink',
                    data: {
                        templateId,
                        templateArgs,
                        next: nextMessage
                    },
                    client
                });
            } else if (client == 'discord') {
                // chatEvent.emit('send', {
                //     channelId,
                //     type: 'embed',
                //     subType: 'maplestoryInfo',
                //     data: character,
                //     client
                // });
            }

            break;

        default:
            break;
    }
}

module.exports = {
    exec,
};
