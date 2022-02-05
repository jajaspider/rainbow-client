const _ = require("lodash");
const commonRouter = require("./common");
const permissionRouter = require("./permission");
const manageRouter = require("./manage");
const maplestoryRouter = require("./maplestory");
const lostarkRouter = require("./lostark");
// const Room = require("../models/index").Room;

async function router(data, channel) {
  let runMethod = [];
  try {
    let commandPrefix = "!";
    let chat = data.text;
    let sender = data.getSenderInfo(channel);
    let author = _.get(sender, "nickname");
    author = String(author).split("/")[0].trim();

    // 오픈 카톡방이 아니므로 생략처리
    if (_.get(sender, 'userType') != 1000) {
      return runMethod;
    }

    let userNumber = null;
    try {
      userNumber = _.get(sender, 'linkId').toString();
    } catch (e) {

    }

    if (!_.startsWith(chat, commandPrefix)) {
      //commandPrefix로 시작하지않으므로 생략처리;
      return runMethod;
    }

    let roomNumber = _.get(channel, "_channel.channelId").toString();

    let command = chat.replace(commandPrefix, "").split(" ")[0];
    chat = chat.replace(`${commandPrefix}${command}`, "").trim();
    runMethod.push(await commonRouter.router(command, chat, author));
    // 반환되는형태는 sendChat, reply 형태
    if (userNumber) {
      let isManager = await permissionRouter.router(userNumber);
      // 매니저 권한인것으로 확인
      if (_.includes(isManager, 'manager')) {
        runMethod.push(await manageRouter.router(command, chat, channel));
      }
    }

    let roomTypes = await permissionRouter.router(roomNumber);

    if (_.includes(roomTypes, 'maplestory')) {
      runMethod.push(await maplestoryRouter.router(command, chat, channel));
    }

    if (_.includes(roomTypes, 'lostark')) {
      runMethod.push(await lostarkRouter.router(command, chat, author));
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