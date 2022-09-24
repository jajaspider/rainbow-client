const Lostark = require("../models/index").Lostark;
const lostarkService = require("../service/lostark");
const _ = require("lodash");

async function router(command, chat, nickname, channelId, client, senderInfo) {
    let result = null;
    result = await Lostark.find({
        method: command,
    }).lean();

    if (_.isEmpty(result)) {
        result = await Lostark.find({
            alias: command,
        }).lean();
    }

    if (_.isEmpty(result)) {
        return;
    }

    await lostarkService.exec(result[0], chat, nickname, channelId, client, senderInfo);
}

module.exports = {
    router,
};