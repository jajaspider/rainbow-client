const Permission = require("../models/index").Permission;
// const commonService = require("../service/common");
const _ = require("lodash");

async function router(number) {
    let result = null;
    result = await Permission.find({
        id: number,
    }).lean();

    // console.dir(result);

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