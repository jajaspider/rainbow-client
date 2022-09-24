const _ = require("lodash");
const axios = require("axios");
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const async = require("async");

const Lostark = require("../models/index").Lostark;
const {
    chatEvent
} = require('../core/eventBridge');
const COMPRES = "\u200b".repeat(500);
const imageService = require('./imageService');
const rainbowUtil = require('../utils');

let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

async function exec(methodObj, chat, nickname, channelId, client, senderInfo) {
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
                senderInfo,
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
                    senderInfo,
                    client
                });
                return;
            }

            let character = _.get(responseData, 'payload.character');
            let server = _.get(character, 'server');
            let nickName = _.get(character, 'nickname');
            let job = _.get(character, 'job');
            // 전투레벨
            let fightLevel = _.get(character, 'fightLevel');
            // 아이템레벨
            let itemLevel = _.get(character, 'itemLevel');
            // 공격력
            let attack = _.get(character, 'attack');
            // 체력
            let health = _.get(character, 'health');
            // 특성 6개의 값
            let specificList = _.get(character, 'specificList');
            let guildName = _.get(character, 'guildName');
            // 각인 정보
            let engraveList = _.get(character, 'engraveList');
            // 카드 정보
            let cardList = _.get(character, 'cardList');
            // 원정대 레벨
            let expeditionLevel = _.get(character, 'expeditionLevel');
            // 칭호
            let title = _.get(character, 'title');
            // 보석
            let jewel = _.get(character, 'jewel');
            // 모험물
            let collection = _.get(character, 'collection');

            let info = `(${title})${nickName} - ${server} | ${job}\n`;
            info += `원정대 레벨 : ${expeditionLevel}\n`;
            info += `전투 레벨 : ${fightLevel}\n`;
            info += `아이템 레벨 : ${itemLevel}\n`;
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
            info += `\n`;

            for (let _jewel of jewel) {
                let _type = null;
                if (_jewel.type == 'cooldown') {
                    _type = '홍염';
                }
                if (_jewel.type == 'annihilation') {
                    _type = '멸화';
                }
                info += `\n${_jewel.level} | ${_type} | ${_jewel.name} `;
            }
            info += `\n`;

            for (let _collection of collection) {
                info += `\n${_collection.name} : ${_collection.count}`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: info,
                senderInfo,
                client
            });
            break;

        case "crystal":
            response = await axios.get(`http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/crystal`);
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
                    senderInfo,
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
                senderInfo,
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
                    senderInfo,
                    client
                });
                return;
            }
            let expandList = _.get(responseData, 'payload.result');

            let expandInfo = `[보유 캐릭터 정보]`;

            for (let expand of expandList) {
                let characterList = _.get(expand, 'characterList');
                expandInfo += `\n\n＃${_.get(expand, 'server')}`;
                for (let _character of characterList) {
                    expandInfo += `\n- ${_character.name} : ${_character.itemLevel} | ${_character.job}`;
                }
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: expandInfo,
                senderInfo,
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
                senderInfo,
                client
            });
            break;
        case "eventList":
            url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/event`

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
                    senderInfo,
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
                    nextMessage += `\nhttps://lostark.game.onstove.com${eventList[i].link}`;
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
        case "jewel":
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
                    senderInfo,
                    client
                });
                return;
            }

            let jewelCharacter = _.get(responseData, 'payload.character');
            let jewels = _.get(jewelCharacter, 'jewel');

            if (_.isEmpty(jewels)) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: '보석 미장착',
                    senderInfo,
                    client
                });
                break;
            }

            let jewelInfo = `[보석 정보]\n`

            for (let _jewel of jewels) {
                let _type = null;
                if (_jewel.type == 'cooldown') {
                    _type = '홍염';
                }
                if (_jewel.type == 'annihilation') {
                    _type = '멸화';
                }
                jewelInfo += `\n${_jewel.level} | ${_type} | ${_jewel.name} `;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: jewelInfo,
                senderInfo,
                client
            });
            break;

        case "collection":
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
                    senderInfo,
                    client
                });
                return;
            }

            let collectionCharacter = _.get(responseData, 'payload.character');
            let collections = _.get(collectionCharacter, 'collection');

            let collectionInfo = `[수집물 정보]\n`

            for (let _collection of collections) {
                collectionInfo += `\n${_collection.name} : ${_collection.count}`;
            }

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: collectionInfo,
                senderInfo,
                client
            });
            break;

        case "distribute":
            if (chatLength != 1) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: '잘못입력하셨습니다.',
                    senderInfo,
                    client
                });
                return;
            }

            try {
                chat = Number.parseInt(chat);
            }
            catch (e) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: '잘못입력하셨습니다.',
                    senderInfo,
                    client
                });
                return;
            }
            url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/lostark/distribute/${chat}`;

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
                    senderInfo,
                    client
                });
                return;
            }

            let distribute = _.get(responseData, 'payload.result');
            // console.dir(distribute);
            // 입력금액
            let gold = _.get(distribute, 'gold');
            // 수수료 제외한 금액
            let excludeFee = _.get(distribute, 'excludeFee');

            let four = _.get(distribute, '4');
            let eight = _.get(distribute, '8');

            let distributeInfo = `[입찰 계산기] ${gold}G\n`
            distributeInfo += `\n\n＃ 4인 레이드`;
            distributeInfo += `\n- 4인 최적 분배 : ${_.get(four, 'bidPrice')}`;
            distributeInfo += `\n- 4인 최적 선점 : ${_.get(four, 'bestBid')}`;
            distributeInfo += `\n- 입찰자 분배금액 : ${excludeFee - (_.get(four, 'individualGold') * 3)}`;
            distributeInfo += `\n- 1인당 분배금액 : ${_.get(four, 'individualGold')}`;

            distributeInfo += `\n\n＃ 8인 레이드`;
            distributeInfo += `\n- 8인 최적 분배 : ${_.get(eight, 'bidPrice')}`;
            distributeInfo += `\n- 8인 최적 선점 : ${_.get(eight, 'bestBid')}`;
            distributeInfo += `\n- 입찰자 분배금액 : ${excludeFee - (_.get(eight, 'individualGold') * 7)}`;
            distributeInfo += `\n- 1인당 분배금액 : ${_.get(eight, 'individualGold')}`;

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: distributeInfo,
                senderInfo,
                client
            });

            break;

        default:
            break;
    }
}

module.exports = {
    exec,
};
