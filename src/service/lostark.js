const _ = require("lodash");
const axios = require("axios");
const Lostark = require("../models/index").Lostark;
const async = require("async");

async function exec(methodObj, chat, author) {
    let command = _.get(methodObj, "name");
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

        default:
            break;
    }
}

module.exports = {
    exec,
};