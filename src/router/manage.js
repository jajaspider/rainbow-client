const Manage = require("../models/index").Manage;
const manageService = require("../service/manage");
const _ = require("lodash");

async function router(command, chat, channelId, attachmentId, client) {
    let result = null;
    result = await Manage.find({
        method: command,
    }).lean();

    if (_.isEmpty(result)) {
        return;
    }

    await manageService.exec(result[0], chat, channelId, attachmentId, client);
}

module.exports = {
    router,
};