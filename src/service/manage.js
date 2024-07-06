const _ = require("lodash");
const Room = require("../models/index").Room;
const { chatEvent } = require("../core/eventBridge");

const COMMAND = {
  ROOM_REGISTER: "roomRegister",
  NOTICE_ALARM: "noticeAlarm",
  ROOM_INFO: "roomInfo",
  CREATE_NOTICE: "createNotice",
};

const util = require("../utils");

async function exec(methodObj, payload) {
  let chat = _.get(payload, "chat");
  const chatLength = _.split(chat, " ").length;
  const channelId = _.get(payload, "channelId");
  const nickname = _.get(payload, "nickname");
  const client = _.get(payload, "client");
  const senderInfo = _.get(payload, "senderInfo");

  let command = _.get(methodObj, "name");

  if (command == COMMAND.ROOM_REGISTER) {
    if (chat == null) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "등록할 방 타입을 입력해주세요.",
        senderInfo,
        client,
      });
      return;
    }

    let type = null;
    if (chat == "메이플" || chat == "메이플스토리") {
      type = "maplestory";
    } else if (chat == "로아" || chat == "로스트아크") {
      type = "lostark";
    } else if (chat == "더모아") {
      type = "themore";
    } else if (chat == "재테크") {
      type = "financial";
    }

    let result = await Room.find({
      id: channelId,
      type,
    }).lean();

    //없다면 추가
    if (_.isEmpty(result)) {
      try {
        await Room.insertMany({
          id: channelId,
          type,
          notice: false,
        });
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "추가 성공",
          senderInfo,
          client,
        });
        return;
      } catch (e) {
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "추가 실패",
          senderInfo,
          client,
        });
        return;
      }
    }
    //있다면 삭제
    else {
      try {
        await Room.remove({
          id: channelId,
          type,
        });
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "삭제 성공",
          senderInfo,
          client,
        });
        return;
      } catch (e) {
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "삭제 실패",
          senderInfo,
          client,
        });
        return;
      }
    }
  } else if (command == COMMAND.NOTICE_ALARM) {
    if (chat == null) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "등록할 알람 타입을 선택해주세요.",
        senderInfo,
        client,
      });
      return;
    }

    let type = null;
    if (chat == "메이플" || chat == "메이플스토리") {
      type = "maplestory";
    } else if (chat == "로아" || chat == "로스트아크") {
      type = "lostark";
    }

    let result = await Room.find({
      id: channelId,
      type,
    });
    result = util.toJson(result);

    let alarmStatus = _.get(result, "notice");

    try {
      await Room.updateOne(
        {
          id: channelId,
          type,
        },
        {
          $set: {
            notice: !alarmStatus,
          },
        }
      );

      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "설정 변경 완료",
        senderInfo,
        client,
      });
      return;
    } catch (e) {
      console.dir(e);
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "설정 변경 실패",
        senderInfo,
        client,
      });
      return;
    }
  } else if (command == COMMAND.CREATE_NOTICE) {
    // let result = await Room.find({
    //   id: channelId,
    // });
    // result = util.toJson(result);

    // chatEvent.emit("send", {
    //   channelId,
    //   type: "chat",
    //   data: JSON.stringify(result),
    //   senderInfo,
    //   client,
    // });

    console.dir(chat);

    const index = chat.indexOf(" ");
    let roomType, rest;
    if (index !== -1) {
      roomType = chat.substring(0, index);
      rest = chat.substring(index + 1);
    } else {
      roomType = chat;
      rest = "";
    }

    if (!_.isEmpty(roomType)) {
      let rooms = await Room.find({ type: roomType });
      rooms = util.toJson(rooms);

      let typeRooms = _.map(rooms, (_room) => {
        return _room.id;
      });
      for (let _typeRoom of typeRooms) {
        // console.dir(maplestoryRoom);
        // chatEvent.emit('send', {
        //     channelId,
        //     type: 'chat',
        //     data: "추가 성공"
        // });
        let data = `${rest}`;
        chatEvent.emit("send", {
          channelId: _typeRoom,
          type: "chat",
          data,
          client: "kakao-remote",
        });
        chatEvent.emit("send", {
          channelId: _typeRoom,
          type: "chat",
          data,
          client: "discord",
        });
      }
    }
  }
  //debug
  else if (command == COMMAND.ROOM_INFO) {
    let result = await Room.find({
      id: channelId,
    });
    result = util.toJson(result);

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: JSON.stringify(result),
      senderInfo,
      client,
    });
  }
}

module.exports = {
  exec,
};
