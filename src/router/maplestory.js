const Maplestory = require("../models/index").Maplestory;
const maplestoryService = require("../service/maplestory");
const _ = require("lodash");

async function router(command, chat, author) {
    let result = null;
    result = await Maplestory.find({
        method: command,
    }).lean();

    if (_.isEmpty(result)) {
        result = await Maplestory.find({
            alias: [command],
        }).lean();
    }

    if (_.isEmpty(result)) {
        return;
    }

    return await maplestoryService.exec(result[0], chat, author);
}

module.exports = {
    router,
};