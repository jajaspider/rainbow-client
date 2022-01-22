const _ = require("lodash");
const axios = require("axios");
const Maplestory = require("../models/index").Maplestory;
const async = require("async");

async function exec(methodObj, chat, author) {
    let command = _.get(methodObj, "name");
    switch (command) {
        case "selection":
            let chatLength = chat.split(" ").length;
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

        default:
            break;
    }
}

module.exports = {
    exec,
};