const Sender = require("../models/index").Sender;
const utils = require("../utils");
const _ = require("lodash");

class SenderCache {
  constructor() {}

  async init() {
    let sender = await Sender.find({});
    this.sender = utils.toJson(sender);
  }

  get(device) {
    let senderInfo = _.find(this.sender, { name: device });
    return senderInfo;
  }

  compare(device, remoteInfo) {
    let senderInfo = _.find(this.sender, { name: device });

    let remoteAddress = _.get(remoteInfo, "address");
    let remotePort = _.get(remoteInfo, "port");

    let senderAddress = _.get(senderInfo, "address");
    let senderPort = _.get(senderInfo, "port");

    if (remoteAddress == senderAddress && remotePort == senderPort) {
      return true;
    } else {
      console.dir({ senderInfo, remoteInfo });
      return false;
    }
  }

  async set(device, remoteInfo) {
    let senderInfo = _.find(this.sender, { name: device });
    _.set(senderInfo, "address", _.get(remoteInfo, "address"));
    _.set(senderInfo, "port", _.get(remoteInfo, "port"));

    await Sender.findOneAndUpdate({ name: device }, senderInfo);
  }
}

const senderCache = new SenderCache();
senderCache.init();

module.exports = senderCache;
