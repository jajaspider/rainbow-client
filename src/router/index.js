const _ = require("lodash");
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

const commonRouter = require("./common");
const permissionRouter = require("./permission");
const manageRouter = require("./manage");
const maplestoryRouter = require("./maplestory");
const lostarkRouter = require("./lostark");
const {
  chatEvent,
  imageEvent
} = require('../core/eventBridge');
const imageService = require('../service/imageService');

let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));


chatEvent.on('receive', async (user) => {
  try {
    console.dir(user);

    let commandPrefix = "!";
    let chat = _.get(user, 'chat');
    const channelId = _.get(user, 'channelId');
    const nickname = _.get(user, 'nickname');
    // nickname = nickname.split('/')[0].trim();
    const attachmentId = _.get(user, 'attachmentId');
    const client = _.get(user, 'client');

    // 오픈 카톡방이 아니므로 생략처리
    // if (_.get(sender, 'userType') != 1000) {
    //   return;
    // }

    if (chat.includes('vs')) {
      chat = chat.trim();
      let chatSplit = chat.split("vs");
      if (!_.includes(chatSplit, '')) {
        chatEvent.emit('send', {
          channelId,
          type: 'chat',
          data: _.sample(chatSplit).trim(),
          client
        });
      }
    }

    if (!_.startsWith(chat, commandPrefix)) {
      //commandPrefix로 시작하지않으므로 생략처리;
      return;
    }

    // let roomNumber = _.get(channel, "_channel.channelId").toString();

    let command = chat.replace(commandPrefix, "").split(" ")[0];
    chat = chat.replace(`${commandPrefix}${command}`, "").trim();
    await commonRouter.router(command, chat, nickname, channelId, client);
    // 반환되는형태는 sendChat, reply 형태
    let userId = _.get(user, 'userId');
    if (userId) {
      let isManager = await permissionRouter.router(userId);
      // 매니저 권한인것으로 확인
      if (_.includes(isManager, 'manager')) {
        await manageRouter.router(command, chat, channelId, attachmentId, client);
      }
    }

    let roomTypes = await permissionRouter.router(channelId);

    if (_.includes(roomTypes, 'maplestory')) {
      await maplestoryRouter.router(command, chat, nickname, channelId, client);
    }

    if (_.includes(roomTypes, 'lostark')) {
      await lostarkRouter.router(command, chat, nickname, channelId, client);
    }
  } catch (e) {
    // console.dir(e);
  }
});

imageEvent.on('receive', async (imageObj) => {
  let channelId = _.get(imageObj, 'channelId');
  let chat = _.get(imageObj, 'chat');
  let client = _.get(imageObj, 'client');

  let roomTypes = await permissionRouter.router(channelId);
  if (_.includes(roomTypes, 'maplestory')) {
    let searchImage = _.find(imageService.imageCache['maplestory'], {
      name: chat
    });
    if (searchImage) {
      let templateId = 72506;
      let templateArgs = {
        imageUrl: `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/${searchImage.imageUrl.split("/")[0]}/${encodeURIComponent(searchImage.imageUrl.split("/")[1])}`, imageW: searchImage.imageW,
        imageH: searchImage.imageH
      }
      if (client == 'kakao') {
        chatEvent.emit('send', {
          channelId,
          type: 'kakaolink',
          data: {
            templateId,
            templateArgs
          },
          client
        });
      } else if (client == 'discord') {
        chatEvent.emit('send', {
          channelId,
          type: 'embed',
          data: templateArgs,
          client
        });
      }


    }
  }

  if (_.includes(roomTypes, 'lostark')) {
    let searchImage = _.find(imageService.imageCache['lostark'], {
      name: chat
    });
    if (searchImage) {
      let templateId = 72506;
      let templateArgs = {
        imageUrl: `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/${searchImage.imageUrl.split("/")[0]}/${encodeURIComponent(searchImage.imageUrl.split("/")[1])}`,
        imageW: searchImage.imageW,
        imageH: searchImage.imageH
      }

      if (client == 'kakao') {
        chatEvent.emit('send', {
          channelId,
          type: 'kakaolink',
          data: {
            templateId,
            templateArgs
          },
          client
        });
      } else if (client == 'discord') {
        chatEvent.emit('send', {
          channelId,
          type: 'embed',
          subType: 'emoticon',
          data: searchImage,
          client
        });
      }
    }
  }
});

imageEvent.on('save', (image) => {
  imageService.addImage(image.type, image);
})

imageEvent.on('delete', (image) => {
  imageService.deleteImage(image);
})