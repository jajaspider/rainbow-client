const _ = require('lodash');
const commonRouter = require('./common');
const Room = require('../models/index').Room;

async function router(data, channel) {
    let runMethod = [];
    try {
        let commandPrefix = "!";
        let chat = data.text;

        let roomNumber = _.get(channel, "_channel.channelId").toString();

        if (!_.startsWith(chat, commandPrefix)) {
            //commandPrefix로 시작하지않으므로 생략처리;
            return runMethod;
        }

        let command = chat.replace(commandPrefix, "").split(" ")[0];
        chat = chat.replace(`${commandPrefix}${command}`, '').trim();
        runMethod.push(await commonRouter.router(command, chat));
        // 반환되는형태는 sendChat, reply 형태

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
    router
};