const _ = require("lodash");
const axios = require("axios");
const async = require("async");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const Common = require("../models/index").Common;
const { chatEvent } = require("../core/eventBridge");
const COMPRES = "\u200b".repeat(500);
let configPath = path.join(process.cwd(), "config", "rainbow.develop.yaml");
let config = yaml.load(fs.readFileSync(configPath));

const COMMAND = {
  SELECTION: "selection",
  HELP: "help",
  AI: "ai",
};

async function exec(methodObj, payload) {
  //chat은 command부분이 제거된 상태
  let chat = _.get(payload, "chat");
  const chatLength = _.split(chat, " ").length;
  const channelId = _.get(payload, "channelId");
  const nickname = _.get(payload, "nickname");
  const client = _.get(payload, "client");
  const senderInfo = _.get(payload, "senderInfo");

  let command = _.get(methodObj, "name");

  if (command == COMMAND.SELECTION) {
    if (chat == null) {
      let type = _.get(methodObj, "params.type");
      let result = await axios.get(
        `${_.get(config, "site.domain")}:${_.get(
          config,
          "site.port"
        )}/api/v0/${command}/${type}`
      );
      if (result.status != 200) {
        return;
      }

      // 데이터는 api서버에서 rest형태로 보내줘야함.. 잘못된 형태로 구성해놓았음
      let data = _.get(result, "data");
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: data.payload.message,
        senderInfo,
        client,
      });
    } else if (chat != null) {
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
        `${_.get(config, "site.domain")}:${_.get(
          config,
          "site.port"
        )}/api/v0/${command}/register`,
        params
      );
      let data = _.get(result, "data");
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: data.payload.message,
        senderInfo,
        client,
      });
    }
  } else if (command == COMMAND.HELP) {
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

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: result,
      senderInfo,
      client,
    });
  } else if (command == COMMAND.AI) {
    let result = await axios.post(
      `http://192.168.50.66:11434/api/generate`,
      {
        "model": "gemma3:27b",
        "prompt": chat,
        "stream": false
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    let data = _.get(result, "data");

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: data.response,
      senderInfo,
      client,
    });
  }
}

module.exports = {
  exec,
};
