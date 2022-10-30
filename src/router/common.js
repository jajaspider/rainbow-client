const Common = require("../models/index").Common;
const commonService = require("../service/common");
const _ = require("lodash");

async function router(command, payload) {
  let result = null;
  result = await Common.find({
    method: command,
  }).lean();

  if (_.isEmpty(result)) {
    result = await Common.find({
      alias: [command],
    }).lean();
  }

  if (_.isEmpty(result)) {
    return;
  }

  await commonService.exec(result[0], payload);
}

module.exports = {
  router,
};