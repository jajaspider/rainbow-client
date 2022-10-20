const _ = require("lodash");
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

const roomRotuer = require("./room");
const commonRouter = require("./common");
const permissionRouter = require("./permission");
const manageRouter = require("./manage");
const maplestoryRouter = require("./maplestory");
const lostarkRouter = require("./lostark");
const {
  chatEvent
} = require('../core/eventBridge');

let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

chatEvent.on('receive', async (payload) => {
  try {
    let commandPrefix = "!";
    let chat = _.get(payload, 'chat');
    const channelId = _.get(payload, 'channelId');
    const userId = _.get(payload, 'userId');
    let nickname = _.get(payload, 'nickname');
    nickname = _.split(nickname, '/')[0].trim();
    _.set(payload, 'nickname', nickname);
    const client = _.get(payload, 'client');
    const senderInfo = _.get(payload, 'senderInfo');

    if (chat.includes('vs')) {
      chat = chat.trim();
      let chatSplit = chat.split("vs");
      if (!_.includes(chatSplit, '')) {
        chatEvent.emit('send', {
          channelId,
          type: 'chat',
          data: _.sample(chatSplit).trim(),
          senderInfo,
          client
        });
        return;
      }
    }

    if (!_.startsWith(chat, commandPrefix)) {
      //commandPrefix로 시작하지않으므로 생략처리;
      return;
    }

    let command = chat.replace(commandPrefix, "").split(" ")[0];
    chat = chat.replace(`${commandPrefix}${command}`, "").trim();
    //채팅이 command에 의해서 빈값이라면, null로 변경
    if (chat == "") {
      chat = null;
    }
    _.set(payload, 'chat', chat);

    await commonRouter.router(command, payload);
    // 반환되는형태는 sendChat, reply 형태

    if (userId) {
      let isManager = await permissionRouter.router(userId);
      // 매니저 권한인것으로 확인
      if (_.includes(isManager, 'manager')) {
        await manageRouter.router(command, payload);
      }
    }

    let roomTypes = await roomRotuer.router(channelId);

    if (_.includes(roomTypes, 'maplestory')) {
      await maplestoryRouter.router(command, payload);
    }

    if (_.includes(roomTypes, 'lostark')) {
      await lostarkRouter.router(command, payload);
    }
  } catch (e) {
    console.dir(e);
  }
});