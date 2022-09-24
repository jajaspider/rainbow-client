const _ = require("lodash");
const axios = require("axios");
const async = require("async");
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const Common = require("../models/index").Common;
const {
  chatEvent
} = require('../core/eventBridge');
const COMPRES = "\u200b".repeat(500);
let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

async function exec(methodObj, chat, nickname, channelId, client, senderInfo) {
  let command = _.get(methodObj, "name");
  switch (command) {
    case "selection":
      let chatLength = chat.split(" ").length;
      if (chat == "") {
        let type = _.get(methodObj, "params.type");
        let result = await axios.get(
          `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/${command}/${type}`
        );
        if (result.status != 200) {
          return {};
        }

        let data = _.get(result, "data");
        // console.dir(data);
        chatEvent.emit('send', {
          channelId,
          type: 'chat',
          data: data.payload.message,
          senderInfo,
          client
        });
        // return {
        //   type: "sendChat",
        //   result: data.payload.message,
        // };
      } else if (chatLength >= 1) {
        let type = _.get(methodObj, "params.type");
        if (type == "channel") {
          return;
        }
        let params = {
          name: chat,
          type,
          author: nickname,
        };

        let result = await axios.post(
          `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/${command}/register`,
          params
        );
        let data = _.get(result, "data");
        chatEvent.emit('send', {
          channelId,
          type: 'chat',
          data: data.payload.message,
          senderInfo,
          client
        });
        // return {
        //   type: "sendChat",
        //   result: data.payload.message,
        // };
      }
      break;
    case "help":
      let commonMethods = await Common.find({}).lean();

      let result = `[기본 명령어]${COMPRES}`;
      try {
        await async.mapLimit(commonMethods, 5, async (methods) => {
          let method = _.get(methods, "method");
          let alias = _.get(methods, "alias");
          let description = _.get(methods, "description");
          result += `\n\n명령어 : ${method}\n대체 명령어 : ${alias}\n설명 : ${description}`;
        });
      } catch (e) {
        // console.dir(e);
      }

      chatEvent.emit('send', {
        channelId,
        type: 'chat',
        data: result,
        senderInfo,
        client
      });
    // return {
    //   type: "sendChat",
    //     result,
    // };
  }
}

module.exports = {
  exec,
};