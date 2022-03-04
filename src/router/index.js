const _ = require("lodash");
const commonRouter = require("./common");
const permissionRouter = require("./permission");
const manageRouter = require("./manage");
const maplestoryRouter = require("./maplestory");
const lostarkRouter = require("./lostark");
// const rabbitmq = require('../core/rabbitmq');
// const Room = require("../models/index").Room;
const {
  chatEvent
} = require('../core/eventBridge');

// async function consumeRouter(msg) {
//   msg.ack;
//   console.dir(msg);
// }

chatEvent.on('receive', async (user) => {
  // let runMethod = [];
  try {
    // console.dir(user);

    let commandPrefix = "!";
    let chat = _.get(user, 'chat');
    const channelId = _.get(user, 'channelId');
    let nickname = _.get(user, 'nickname');
    nickname = nickname.split('/')[0].trim();
    // let sender = data.getSenderInfo(channel);
    // let author = _.get(sender, "nickname");
    // author = String(author).split("/")[0].trim();

    // 오픈 카톡방이 아니므로 생략처리
    // if (_.get(sender, 'userType') != 1000) {
    //   return;
    // }

    if (!_.startsWith(chat, commandPrefix)) {
      //commandPrefix로 시작하지않으므로 생략처리;
      return;
    }

    // let roomNumber = _.get(channel, "_channel.channelId").toString();

    let command = chat.replace(commandPrefix, "").split(" ")[0];
    chat = chat.replace(`${commandPrefix}${command}`, "").trim();
    // runMethod.push(await commonRouter.router(command, chat, author));
    await commonRouter.router(command, chat, nickname, channelId);
    // // 반환되는형태는 sendChat, reply 형태
    let userId = _.get(user, 'userId');
    if (userId) {
      let isManager = await permissionRouter.router(userId);
      // 매니저 권한인것으로 확인
      if (_.includes(isManager, 'manager')) {
        // runMethod.push(await manageRouter.router(command, chat, channel));
        await manageRouter.router(command, chat, channelId);
      }
    }

    let roomTypes = await permissionRouter.router(channelId);

    if (_.includes(roomTypes, 'maplestory')) {
      await maplestoryRouter.router(command, chat, channelId);
    }

    if (_.includes(roomTypes, 'lostark')) {
      await lostarkRouter.router(command, chat, nickname, channelId);
    }

    // return runMethod;
    // console.dir(roomType);
  } catch (e) {
    console.dir(e);
  }
})