const _ = require("lodash");
const axios = require("axios");
const Maplestory = require("../models/index").Maplestory;
const async = require("async");
const {
    chatEvent
} = require('../core/eventBridge');
const COMPRES = "\u200b".repeat(500);
const imageService = require('./imageService');
const rainbowUtil = require('../utils');

async function exec(methodObj, chat, nickname, channelId, client) {
    let command = _.get(methodObj, "name");
    let chatSplit = chat.split(" ");
    let chatLength = chatSplit.length;
    let url = null;
    let templateId = null;
    let templateArgs = null;
    switch (command) {
        case "selection":
            if (chat == "") {
                let type = _.get(methodObj, "params.type");
                let result = await axios.get(
                    `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/${command}/${type}`
                );
                if (result.status != 200) {
                    return {};
                }

                let data = _.get(result, "data");
                // console.dir(data);
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: data.payload.message,
                    client
                });
                return;
            } else if (chatLength >= 1) {
                return;
            }
            break;
        case "help":
            let maplestoryMethods = await Maplestory.find({}).lean();

            let result = `[메이플스토리 명령어]${COMPRES}`;
            try {
                await async.mapLimit(maplestoryMethods, 5, async (methods) => {
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
            if (chat == "") {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/maplestory/info/${encodeURIComponent(nickname)}`;
            } else if (chatLength > 1) {
                return;
            } else {
                url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/maplestory/info/${encodeURIComponent(chat)}`;
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

            //정보 명령어용 템플릿
            templateId = 54726;
            let character = _.get(responseData, 'payload.character');

            templateArgs = {
                character_name: _.get(character, 'name'),
                character_level: _.get(character, 'level'),
                character_class: _.get(character, 'class'),
                character_exp: _.get(character, 'exp'),
                character_pop: _.get(character, 'pop'),
                character_ranking1: _.get(character, 'ranking.current'),
                character_ranking2: _.get(character, 'ranking.change'),
                character_guild: _.get(character, 'guild'),
                character_thumbnail: _.get(character, 'img'),
                // server_thumbnail: _.pick(character, 'img'),
                character_dojang: _.get(character, 'dojang.stair', '-'),
                dojang_time: _.get(character, 'dojang.time', '-'),
                character_seed: _.get(character, 'seed.stair', '-'),
                seed_time: _.get(character, 'seed.time', '-'),
            };

            if (client == 'kakao') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'kakaolink',
                    data: {
                        templateId,
                        templateArgs
                    },
                    client
                });
            } else if (client == 'discord') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'embed',
                    subType: 'maplestoryInfo',
                    data: character,
                    client
                });
            }
            //카카오링크 추가
            break;
        case 'starforce':
            if (chatLength != 2) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: "잘못입력하셨습니다.",
                    client
                });
                return;
                // return {
                //     type: "sendChat",
                //     result: '잘못입력하셨습니다.',
                // }
            }
            url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/maplestory/starforce/${chatSplit[0]}/${chatSplit[1]}`;
            response = await axios.get(url);
            if (response.status != 200) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: 'api 데이터 수신 실패',
                    client
                });
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
            }

            let starforce = _.get(responseData, 'payload.starforce');
            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: `방어구 ${chatSplit[1]}성 강화시\n스탯 : ${starforce.stat}\n공격력 : ${starforce.attack}`,
                client
            });
            break;

        case "growth":
            if (chatLength == 1) {
                let type = _.get(methodObj, "params.type");
                let response = await axios({
                    url: `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/maplestory/growth/${chat}`,
                    method: 'get',
                    data: {
                        type
                    }
                })
                if (response.status != 200) {
                    return;
                }

                responseData = _.get(response, "data");
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: responseData.payload.percent,
                    client
                });
            }
            break;

        case 'muto':
            if (chatLength != 1 || chat == '') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: '잘못입력하셨습니다.',
                    client
                });
                return;
            }

            url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/images/muto/${encodeURIComponent(chat)}`;
            response = await axios.get(url);
            if (response.status != 200) {
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: 'api 데이터 수신 실패',
                    client
                });
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
            }

            let image = _.get(responseData, 'payload.image');

            templateId = 72506;
            templateArgs = {
                imageUrl: `http://sonaapi.com:30003/${image.imageUrl.split("/")[0]}/${encodeURIComponent(image.imageUrl.split("/")[1])}`,
                imageW: image.imageW,
                imageH: image.imageH
            }
            if (client == 'kakao') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'kakaolink',
                    data: {
                        templateId,
                        templateArgs
                    },
                    client
                });
            } else if (client == 'discord') {
                chatEvent.emit('send', {
                    channelId,
                    type: 'embed',
                    subType: 'emoticon',
                    data: image,
                    client
                });
            }
            break;
        case "emoticon":
            let images = imageService.getImage('maplestory');
            let emoticonList = `[메이플스토리 이모티콘]\n${COMPRES}`;
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

        case "classSelection":
            if (chat == "") {
                let response = await axios({
                    url: `http://127.0.0.1:30003/v0/selection/maple/class`,
                    method: 'get'
                })
                if (response.status != 200) {
                    return;
                }

                responseData = _.get(response, "data");
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: responseData.payload.message,
                    client
                });
            } else if (chatLength == 1) {
                let response = await axios({
                    url: `http://127.0.0.1:30003/v0/selection/maple/class/${encodeURIComponent(chatSplit[0])}`,
                    method: 'get'
                })
                if (response.status != 200) {
                    return;
                }

                responseData = _.get(response, "data");
                chatEvent.emit('send', {
                    channelId,
                    type: 'chat',
                    data: responseData.payload.message,
                    client
                });
                // return {
                //     type: "sendChat",
                //     result: responseData.payload.percent,
                // };
            }
            break;

        case "unionInfo":
            if (chat == "") {
                url = `http://127.0.0.1:30003/v0/maplestory/union/${encodeURIComponent(nickname)}`
            } else if (chatLength == 1) {
                url = `http://127.0.0.1:30003/v0/maplestory/union/${encodeURIComponent(chatSplit[0])}`
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
                // return {
                //     type: "sendChat",
                //     result: errorMessage,
                // }
            }

            let characterName = _.get(responseData, 'payload.character.name');
            let unionRanking = _.get(responseData, 'payload.character.unionRanking');
            let unionLevel = _.get(responseData, 'payload.character.unionLevel');
            let unionPower = _.get(responseData, 'payload.character.unionPower');
            let unionCoinPerDay = _.get(responseData, 'payload.character.unionCoinPerDay');
            let message = `[${characterName}님의 유니온 정보]\n랭킹 : ${unionRanking}\n레벨 : ${unionLevel}\n공격력 : ${unionPower}\n일일 코인 획득량 : ${unionCoinPerDay}`;

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: message,
                client
            });
            break;
        case "eventList":
            url = `http://127.0.0.1:30003/v0/maplestory/event`

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
                templateArgs[`event_contents_${i + 1}`] = eventList[i].date;
                templateArgs[`event_image_${i + 1}`] = eventList[i].img_path;
                templateArgs[`url${i + 1}`] = eventList[i].link;
            }

            templateId = 54716;

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

        case "symbol":
            if (chatLength != 2) {
                break;
            }

            url = `http://127.0.0.1:30003/v0/maplestory/symbol/${chatSplit[0]}/${chatSplit[1]}`;
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

            let requireArcaneSymbol = _.get(responseData.payload, 'symbol.requireArcaneSymbol');
            let journeyMeso = _.get(responseData.payload, 'symbol.journeyMeso');
            journeyMeso = journeyMeso.toLocaleString();
            let chuchuMeso = _.get(responseData.payload, 'symbol.chuchuMeso');
            chuchuMeso = chuchuMeso.toLocaleString();
            let lacheleinMeso = _.get(responseData.payload, 'symbol.lacheleinMeso');
            lacheleinMeso = lacheleinMeso.toLocaleString();
            let afterArcanaMeso = _.get(responseData.payload, 'symbol.afterArcanaMeso');
            afterArcanaMeso = afterArcanaMeso.toLocaleString();
            let requireAthenticSymbol = _.get(responseData.payload, 'symbol.requireAthenticSymbol');
            let cerniumMeso = _.get(responseData.payload, 'symbol.cerniumMeso');
            cerniumMeso = cerniumMeso.toLocaleString();
            let arcusMeso = _.get(responseData.payload, 'symbol.arcusMeso');
            arcusMeso = arcusMeso.toLocaleString();
            let odiumMeso = _.get(responseData.payload, 'symbol.odiumMeso');
            odiumMeso = odiumMeso.toLocaleString();

            let symbolInfo = `[심볼 ${parseInt(chatSplit[0])} -> ${parseInt(chatSplit[1])} 요구치]\n`;
            symbolInfo += `\n아케인 심볼 : ${requireArcaneSymbol}`;
            symbolInfo += `\n여로 필요 메소 : ${journeyMeso}`;
            symbolInfo += `\n츄츄 필요 메소 : ${chuchuMeso}`;
            symbolInfo += `\n레헬른 필요 메소 : ${lacheleinMeso}`;
            symbolInfo += `\n아르카나 이후 필요 메소 : ${afterArcanaMeso}`;
            symbolInfo += `\n\n어센틱 심볼 : ${requireAthenticSymbol}`;
            symbolInfo += `\n세르니움 필요 메소 : ${cerniumMeso}`;
            symbolInfo += `\n아르크스 필요 메소 : ${arcusMeso}`;
            symbolInfo += `\n오디움 필요 메소 : ${odiumMeso}`;

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: symbolInfo,
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