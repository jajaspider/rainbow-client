const _ = require("lodash");
const axios = require("axios");
const Lostark = require("../models/index").Lostark;
const async = require("async");

async function exec(methodObj, chat, author) {
    let command = _.get(methodObj, "name");
    let chatLength = chat.split(" ").length;
    switch (command) {
        case "help":
            let maplestoryMethods = await Lostark.find({}).lean();

            let result = "[로스트아크 명령어]\n";
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

            break;
        case 'info':
            let url = null;
            if (chat == '') {
                url = `http://localhost:30003/v0/lostark/info/${encodeURIComponent(author)}`;
            } else if (chatLength == 1) {
                url = `http://localhost:30003/v0/lostark/info/${encodeURIComponent(chat)}`;
            }
            let request = await axios.get(url);
            if (request.status != 200) {
                return {};
            }
            let data = _.get(request, "data");
            let errorMessage = _.get(data, 'payload.message');
            if (errorMessage) {
                return {
                    type: "sendChat",
                    result: errorMessage,
                }
            }

            let character = _.get(data, 'payload.character');
            let server = _.get(character, 'server');
            let nickname = _.get(character, 'nickname');
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

            return {
                type: "sendChat",
                    result: info,
            };

        default:
            break;
    }
}

module.exports = {
    exec,
};