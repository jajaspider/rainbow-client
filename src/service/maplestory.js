const _ = require("lodash");
const axios = require("axios");
const Maplestory = require("../models/index").Maplestory;
const async = require("async");

async function exec(methodObj, chat, channel) {
    let roomName = channel.info.openLink.linkName;
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;
    switch (command) {
        case "selection":
            if (chat == "") {
                let type = _.get(methodObj, "params.type");
                let result = await axios.get(
                    `http://localhost:30003/v0/${command}/${type}`
                );
                if (result.status != 200) {
                    return {};
                }

                let data = _.get(result, "data");
                // console.dir(data);
                return {
                    type: "sendChat",
                    result: data.payload.message,
                };
            } else if (chatLength >= 1) {
                return;
            }
            break;
        case "help":

            let maplestoryMethods = await Maplestory.find({}).lean();

            let result = "[메이플스토리 명령어]\n";
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

            return {
                type: "sendChat",
                result,
            };
        case 'info':
            if (chat == '') {
                url = `http://localhost:30003/v0/maplestory/info/${encodeURIComponent(author)}`;
            } else if (chatLength == 1) {
                url = `http://localhost:30003/v0/maplestory/info/${encodeURIComponent(chat)}`;
            }
            response = await axios.get(url);
            if (response.status != 200) {
                return {};
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                return {
                    type: "sendChat",
                    result: errorMessage,
                }
            }

            //정보 명령어용 템플릿
            let templateId = 54726;
            let character = _.get(responseData, 'payload.character');

            let templateArgs = {
                character_name: _.get(character, 'name'),
                character_level: _.get(character, 'level'),
                character_class: _.get(character, 'class'),
                // character_exp: _.pick(character, 'exp'),
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

            return {
                type: "kakaolink",
                result: {
                    roomName,
                    templateId,
                    templateArgs
                },
            };

        case 'starforce':
            if (chatLength != 2) {
                return {
                    type: "sendChat",
                    result: '잘못입력하셨습니다.',
                }
            }
            let params = chat.split(" ");
            let url = `http://localhost:30003/v0/maplestory/starfoce/${params[0]}/${params[1]}`;
            response = await axios.get(url);
            if (response.status != 200) {
                return {
                    type: "sendChat",
                    result: 'api 데이터 수신 실패',
                };
            }
            responseData = _.get(response, "data");
            errorMessage = _.get(responseData, 'payload.message');
            if (errorMessage) {
                return {
                    type: "sendChat",
                    result: errorMessage,
                }
            }

            let starforce = _.get(responseData, 'payload.starforce');
            return {
                type: "sendChat",
                result: `방어구 ${params[1]}성 강화시\n스탯 : ${starforce.stat}\n공격력 : ${starforce.attack}`
            }

        default:
            break;
    }
}

module.exports = {
    exec,
};