const _ = require("lodash");
const commonRouter = require("./common");
const permissionRouter = require("./permission");
const manageRouter = require("./manage");
const maplestoryRouter = require("./maplestory");
// const Room = require("../models/index").Room;

async function router(data, channel) {
  let runMethod = [];
  try {
    let commandPrefix = "!";
    let chat = data.text;
    let sender = data.getSenderInfo(channel);
    let author = _.get(sender, "nickname");

    // 오픈 카톡방이 아니므로 생략처리
    if (_.get(sender, 'userType') != 1000) {
      return runMethod;
    }

    if (!_.startsWith(chat, commandPrefix)) {
      //commandPrefix로 시작하지않으므로 생략처리;
      return runMethod;
    }

    let roomNumber = _.get(channel, "_channel.channelId").toString();
    let userNumber = _.get(sender, 'openToken');

    let command = chat.replace(commandPrefix, "").split(" ")[0];
    chat = chat.replace(`${commandPrefix}${command}`, "").trim();
    runMethod.push(await commonRouter.router(command, chat, author));
    // 반환되는형태는 sendChat, reply 형태
    let isManager = await permissionRouter.router(userNumber);
    let roomTypes = await permissionRouter.router(roomNumber);
    // console.dir(isManager);

    // 매니저 권한인것으로 확인
    if (_.includes(isManager, 'manager')) {
      runMethod.push(await manageRouter.router(command, chat, channel));
    }

    if (_.includes(roomTypes, 'maplestory')) {
      runMethod.push(await maplestoryRouter.router(command, chat, channel));
    }

    return runMethod;
    // console.dir(roomType);
  } catch (e) {
    console.dir(e);
  }

  // let roomType = await Room.find({
  //     number: roomNumber
  // });
}

module.exports = {
  router,
};