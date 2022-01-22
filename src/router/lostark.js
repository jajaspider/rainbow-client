const Lostark = require("../models/index").Lostark;
const lostarkService = require("../service/lostark");
const _ = require("lodash");

async function router(command, chat, author) {
    let result = null;
    result = await Lostark.find({
        method: command,
    }).lean();

    if (_.isEmpty(result)) {
        result = await Lostark.find({
            alias: [command],
        }).lean();
    }

    if (_.isEmpty(result)) {
        return;
    }

    return await lostarkService.exec(result[0], chat, author);
}

module.exports = {
    router,
};