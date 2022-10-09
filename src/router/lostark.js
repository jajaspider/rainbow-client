const Lostark = require("../models/index").Lostark;
const lostarkService = require("../service/lostark");
const _ = require("lodash");

async function router(command, payload) {
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

    await lostarkService.exec(result[0], payload);
}

module.exports = {
    router,
};