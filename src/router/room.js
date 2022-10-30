const Room = require("../models/index").Room;
// const commonService = require("../service/common");
const _ = require("lodash");

async function router(roomId) {
    let result = null;
    result = await Room.find({
        id: roomId,
    }).lean();

    if (_.isEmpty(result)) {
        return;
    }

    let resultTypes = _.map(result, (resultObj) => {
        return resultObj.type;
    })

    return resultTypes;
}

module.exports = {
    router,
};