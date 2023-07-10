const _ = require("lodash");
const axios = require("axios");
const async = require("async");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

const Maplestory = require("../models/index").Maplestory;
const { chatEvent } = require("../core/eventBridge");
const COMPRES = "\u200b".repeat(500);
const imageService = require("./imageService");
const rainbowUtil = require("../utils");

let configPath = path.join(process.cwd(), "config", "rainbow.develop.yaml");
let config = yaml.load(fs.readFileSync(configPath));

const COMMAND = {
  SELECTION: "selection",
  HELP: "help",
  INFO: "info",
  STARFORCE: "starforce",
  GROWTH: "growth",
  MUTO: "muto",
  EMOTICON_LIST: "emoticon",
  CLASS_SELECTION: "classSelection",
  UNION: "unionInfo",
  EVENT_LIST: "eventList",
  SYMBOL: "symbol",
  DAILY_QUEST: "dailyQuest",
  MONSTER_PARK: "monsterPark",
  SYMBOL_GROWTH: "symbolGrowth",
};

async function exec(methodObj, payload) {
  //chat은 command부분이 제거된 상태
  let chat = _.get(payload, "chat");
  const chatSplit = _.split(chat, " ");
  const chatLength = chatSplit.length;
  const channelId = _.get(payload, "channelId");
  const nickname = _.get(payload, "nickname");
  const client = _.get(payload, "client");
  const senderInfo = _.get(payload, "senderInfo");

  let command = _.get(methodObj, "name");

  // !채널
  if (command == COMMAND.SELECTION) {
    //인자를 입력안했다면 랜덤 1개 선택
    if (chat == null) {
      let type = _.get(methodObj, "params.type");
      let result = await axios.get(
        `http://${_.get(config, "site.domain")}:${_.get(
          config,
          "site.port"
        )}/api/v0/${command}/${type}`
      );
      if (result.status != 200) {
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "api 데이터 수신 실패",
          senderInfo,
          client,
        });
        return;
      }

      let data = _.get(result, "data");
      // console.dir(data);
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: data.payload.message,
        senderInfo,
        client,
      });
      return;
    }
    // !채널 명령어 이기때문에 인자를 입력하면 에러
    else if (chatLength >= 1) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: `잘못 입력하셨습니다.`,
        senderInfo,
        client,
      });
      return;
    }
  }
  // !도움말
  else if (command == COMMAND.HELP) {
    let maplestoryMethods = await Maplestory.find({}).lean();

    let result = `[메이플스토리 명령어]${COMPRES}`;
    try {
      await async.mapLimit(maplestoryMethods, 5, async (methods) => {
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
    return;
  }
  // !정보
  else if (command == COMMAND.INFO) {
    let requestUrl = null;
    if (chat == null) {
      requestUrl = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/info/${encodeURIComponent(nickname)}`;
    } else {
      requestUrl = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/info/${encodeURIComponent(chat)}`;
    }

    let response = await axios.get(requestUrl);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");

    let nickName = _.get(responseData, "name");
    // let server = server;
    let job = _.get(responseData, "class");
    let level = _.get(responseData, "level");
    let exp = _.get(responseData, "exp");
    let pop = _.get(responseData, "pop");
    let currentRanking = _.get(responseData, "ranking.current");
    let changeRanking = _.get(responseData, "ranking.change");
    let guild = _.get(responseData, "guild");
    let dojangStair = _.get(responseData, "dojang.stair", "-");
    let dojangTime = _.get(responseData, "dojang.time", "-");
    let seedStair = _.get(responseData, "seed.stair", "-");
    let seedTime = _.get(responseData, "seed.time", "-");

    /*
      character_thumbnail: _.get(character, "img"),
      // server_thumbnail: _.pick(character, 'img'),
      server_thumbnail: _.get(character, "worldSrc"),
      */

    let info = `${nickName}(${pop}) | ${job}\n`;
    info += `레벨 : ${level} - ${exp}%\n`;
    info += `길드 : ${guild}\n`;
    info += `랭킹 : ${currentRanking}(${changeRanking})\n\n`;
    info += `무릉도장 : ${dojangStair}층(${dojangTime})\n`;
    info += `더시드 : ${seedStair}층(${seedTime})\n`;

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: info,
      senderInfo,
      client,
    });
  }
  // !스타포스
  else if (command == COMMAND.STARFORCE) {
    if (chatLength != 2) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let requestUrl = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/starforce/${chatSplit[0]}/${chatSplit[1]}`;
    let response = await axios.get(requestUrl);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");
    let errorMessage = _.get(responseData, "payload.message");
    if (errorMessage) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: errorMessage,
        senderInfo,
        client,
      });
    }

    let starforce = _.get(responseData, "payload.starforce");
    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: `방어구 ${chatSplit[1]}성 강화시\n스탯 : ${starforce.stat}\n공격력 : ${starforce.attack}`,
      senderInfo,
      client,
    });
  }
  // !성장의비약
  else if (command == COMMAND.GROWTH) {
    if (chatLength >= 2) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let type = _.get(methodObj, "params.type");
    let response = await axios({
      url: `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/growth/${chat}`,
      method: "get",
      data: {
        type,
      },
    });

    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");
    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: responseData.payload.percent,
      senderInfo,
      client,
    });
  }
  // !무토
  else if (command == COMMAND.MUTO) {
    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: "미지원",
      senderInfo,
      client,
    });
    return;

    // if (chat == null || chatLength > 1) {
    //     chatEvent.emit('send', {
    //         channelId,
    //         type: 'chat',
    //         data: '잘못입력하셨습니다.',
    //         senderInfo,
    //         client
    //     });
    //     return;
    // }

    // let url = `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/v0/images/muto/${encodeURIComponent(chat)}`;
    // let response = await axios.get(url);
    // if (response.status != 200) {
    //     chatEvent.emit('send', {
    //         channelId,
    //         type: 'chat',
    //         data: 'api 데이터 수신 실패',
    //         senderInfo,
    //         client
    //     });
    //     return;
    // }

    // let responseData = _.get(response, "data");
    // let errorMessage = _.get(responseData, 'payload.message');
    // if (errorMessage) {
    //     chatEvent.emit('send', {
    //         channelId,
    //         type: 'chat',
    //         data: errorMessage,
    //         senderInfo,
    //         client
    //     });
    // }

    // let image = _.get(responseData, 'payload.image');

    // let templateId = 72506;
    // let templateArgs = {
    //     imageUrl: `http://${_.get(config, 'site.domain')}:${_.get(config, 'site.port')}/api/${image.imageUrl.split("/")[0]}/${encodeURIComponent(image.imageUrl.split("/")[1])}`,
    //     imageW: image.imageW,
    //     imageH: image.imageH
    // }
    // if (client == 'kakao') {
    //     chatEvent.emit('send', {
    //         channelId,
    //         type: 'kakaolink',
    //         data: {
    //             templateId,
    //             templateArgs
    //         },
    //         client
    //     });
    // } else if (client == 'discord') {
    //     chatEvent.emit('send', {
    //         channelId,
    //         type: 'embed',
    //         subType: 'emoticon',
    //         data: image,
    //         client
    //     });
    // }
  }
  // !이모티콘리스트
  else if (command == COMMAND.EMOTICON_LIST) {
    let images = imageService.getImage("maplestory");
    let emoticonList = `[메이플스토리 이모티콘]\n${COMPRES}`;
    for (let image of images) {
      emoticonList += `\n${image.name}`;
    }

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: emoticonList,
      senderInfo,
      client,
    });
    return;
  }
  // !직업
  else if (command == COMMAND.CLASS_SELECTION) {
    let url = null;
    if (chat == null) {
      url = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/selection/maple/class`;
    } else if (chatLength == 1) {
      url = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/selection/maple/class/${encodeURIComponent(chat)}`;
    }

    let response = await axios.get(url);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");
    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: responseData.payload.message,
      senderInfo,
      client,
    });
    return;
  }
  // !유니온
  else if (command == COMMAND.UNION) {
    let url = null;
    if (chat == null) {
      url = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/union/${encodeURIComponent(nickname)}`;
    } else if (chatLength == 1) {
      url = `http://${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/union/${encodeURIComponent(chatSplit[0])}`;
    }

    let response = await axios.get(url);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");

    let nickName = _.get(responseData, "name");
    let unionRanking = _.get(responseData, "unionRanking");
    let unionLevel = _.get(responseData, "unionLevel");
    let unionPower = _.get(responseData, "unionPower");
    let unionCoinPerDay = _.get(responseData, "unionCoinPerDay");

    let message = `[${nickName}님의 유니온 정보]\n랭킹 : ${unionRanking}\n레벨 : ${unionLevel}\n공격력 : ${unionPower}\n일일 코인 획득량 : ${unionCoinPerDay}`;

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: message,
      senderInfo,
      client,
    });
    return;
  }
  // !이벤트
  else if (command == COMMAND.EVENT_LIST) {
    let maplestoryEndpoint = "https://maplestory.nexon.com";

    let url = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/event`;

    let response = await axios.get(url);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let responseData = _.get(response, "data");
    let errorMessage = _.get(responseData, "payload.message");
    if (errorMessage) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: errorMessage,
        senderInfo,
        client,
      });
      return;
    }

    let eventList = _.get(responseData, "payload.events");

    let eventInfo = "[메이플스토리 이벤트]";

    for (let _event of eventList) {
      eventInfo += `\n${_event.title}\n`;
      eventInfo += `기간 : ${_event.date}\n`;
      eventInfo += `${maplestoryEndpoint}${_event.link}\n`;
    }

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: eventInfo,
      senderInfo,
      client,
    });
    return;
  }
  // !심볼
  else if (command == COMMAND.SYMBOL) {
    if (chatLength != 2) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let url = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/symbol/${chatSplit[0]}/${chatSplit[1]}`;
    let response = await axios.get(url);
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let symbolData = _.get(response, "data");

    let requireArcaneSymbol = _.get(symbolData, "requireArcaneSymbol");
    let journeyMeso = _.get(symbolData, "journeyMeso");
    journeyMeso = journeyMeso.toLocaleString();
    let chuchuMeso = _.get(symbolData, "chuchuMeso");
    chuchuMeso = chuchuMeso.toLocaleString();
    let lacheleinMeso = _.get(symbolData, "lacheleinMeso");
    lacheleinMeso = lacheleinMeso.toLocaleString();
    let arcanaMeso = _.get(symbolData, "arcanaMeso");
    arcanaMeso = arcanaMeso.toLocaleString();
    let morassMeso = _.get(symbolData, "morassMeso");
    morassMeso = morassMeso.toLocaleString();
    let esferaMeso = _.get(symbolData, "esferaMeso");
    esferaMeso = esferaMeso.toLocaleString();

    let requireAthenticSymbol = _.get(symbolData, "requireAthenticSymbol");

    let cerniumMeso = _.get(symbolData, "cerniumMeso");
    cerniumMeso = cerniumMeso.toLocaleString();
    let arcusMeso = _.get(symbolData, "arcusMeso");
    arcusMeso = arcusMeso.toLocaleString();
    let odiumMeso = _.get(symbolData, "odiumMeso");
    odiumMeso = odiumMeso.toLocaleString();
    let shangriLaMeso = _.get(symbolData, "shangriLaMeso");
    shangriLaMeso = shangriLaMeso.toLocaleString();

    let symbolInfo = `[심볼 ${parseInt(chatSplit[0])} -> ${parseInt(
      chatSplit[1]
    )} 요구치]\n`;
    symbolInfo += `\n아케인 심볼 : ${requireArcaneSymbol}`;
    symbolInfo += `\n여로 필요 메소 : ${journeyMeso}`;
    symbolInfo += `\n츄츄 필요 메소 : ${chuchuMeso}`;
    symbolInfo += `\n레헬른 필요 메소 : ${lacheleinMeso}`;
    symbolInfo += `\n아르카나 필요 메소 : ${arcanaMeso}`;
    symbolInfo += `\n모라스 필요 메소 : ${morassMeso}`;
    symbolInfo += `\n에스페라 필요 메소 : ${esferaMeso}`;
    symbolInfo += `\n\n어센틱 심볼 : ${requireAthenticSymbol}`;
    symbolInfo += `\n세르니움 필요 메소 : ${cerniumMeso}`;
    symbolInfo += `\n아르크스 필요 메소 : ${arcusMeso}`;
    symbolInfo += `\n오디움 필요 메소 : ${odiumMeso}`;
    symbolInfo += `\n도원경 필요 메소 : ${shangriLaMeso}`;

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: symbolInfo,
      senderInfo,
      client,
    });
    return;
  }

  //심볼 성장치
  else if (command == COMMAND.SYMBOL_GROWTH) {
    let level = chatSplit[0];
    let count = chatSplit[1];

    if (chatLength != 2) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    level = parseInt(level);
    count = parseInt(count);

    if (_.isNaN(level) || _.isNaN(count)) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "숫자로 입력하세요.",
        senderInfo,
        client,
      });
      return;
    }

    let url = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/symbol/growth`;
    let response = await axios.post(url, {
      level,
      count,
    });
    if (response.status != 200) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "api 데이터 수신 실패",
        senderInfo,
        client,
      });
      return;
    }

    let growthData = _.get(response, "data");

    let arcaneDate = _.split(_.get(growthData, "arcaneDate"), "-");
    let requireArcane = _.get(growthData, "requireArcane");
    let arcaneWeek = _.get(growthData, "arcaneWeek");
    let arcaneDay = _.get(growthData, "arcaneDay");

    let cerniumDate = _.split(_.get(growthData, "cerniumDate"), "-");
    let arthenticDate = _.split(_.get(growthData, "arthenticDate"), "-");
    let requireAthentic = _.get(growthData, "requireAthentic");
    let cerniumDay = _.get(growthData, "cerniumDay");
    let arthenticDay = _.get(growthData, "arthenticDay");

    let growthInfo = `[심볼 성장]\n`;
    growthInfo += `\n# 아케인\n`;

    growthInfo += `\n총 필요갯수 : ${requireArcane}`;
    growthInfo += `\n아케인 심볼 : ${arcaneDate[0]}년 ${arcaneDate[1]}월 ${arcaneDate[2]}일`;

    growthInfo += `\n${arcaneWeek}주 ${arcaneDay}일 소요`;

    if (level < 11) {
      growthInfo += `\n\n# 어센틱\n`;
      growthInfo += `\n총 필요갯수 : ${requireAthentic}`;
      growthInfo += `\n어센틱 심볼(세르) : ${cerniumDate[0]}년 ${cerniumDate[1]}월 ${cerniumDate[2]}일`;
      growthInfo += `\n${cerniumDay}일 소요`;
      growthInfo += `\n어센틱 심볼(그외) : ${arthenticDate[0]}년 ${arthenticDate[1]}월 ${arthenticDate[2]}일`;
      growthInfo += `\n${arthenticDay}일 소요`;
    }

    chatEvent.emit("send", {
      channelId,
      type: "chat",
      data: growthInfo,
      senderInfo,
      client,
    });
    return;
  }
  // 일일퀘스트
  else if (command == COMMAND.DAILY_QUEST) {
    let level = chatSplit[0];
    try {
      level = parseInt(level);
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "레벨을 잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }
    let regionOrContinent = chatSplit[1];
    let region = null;
    let continent = null;

    // 여로
    if (regionOrContinent == "여로" || regionOrContinent == "소멸의여로") {
      region = "VanishingJourney";
    }
    // 츄츄
    else if (
      regionOrContinent == "츄츄" ||
      regionOrContinent == "츄츄아일랜드"
    ) {
      region = "ChuChu";
    }
    // 레헬른
    else if (regionOrContinent == "레헬른") {
      region = "Lachelein";
    }
    // 아르카나
    else if (regionOrContinent == "아르카나" || regionOrContinent == "알카") {
      region = "Arcana";
    }
    // 모라스
    else if (regionOrContinent == "모라스") {
      region = "Morass";
    }
    // 에스페라
    else if (regionOrContinent == "에스페라" || regionOrContinent == "에페") {
      region = "Esfera";
    }
    // 문브릿지
    else if (regionOrContinent == "문브릿지" || regionOrContinent == "문브") {
      region = "Moonbridge";
    }
    // 미궁
    else if (regionOrContinent == "고통의미궁" || regionOrContinent == "미궁") {
      region = "Labyrinth";
    }
    // 리멘
    else if (regionOrContinent == "리멘") {
      region = "Limina";
    }
    // 세르니움
    else if (
      regionOrContinent == "세르니움" ||
      regionOrContinent == "전르" ||
      regionOrContinent == "전르니움"
    ) {
      region = "Cernium";
    }
    // 호텔아르크스
    else if (
      regionOrContinent == "호텔아르크스" ||
      regionOrContinent == "호텔" ||
      regionOrContinent == "아르크스"
    ) {
      region = "HotelArcus";
    }
    // 오디움
    else if (
      regionOrContinent == "오디움" ||
      regionOrContinent == "눈을뜬실험실오디움"
    ) {
      region = "Odium";
    }
    // 도원경
    else if (
      regionOrContinent == "도원경" ||
      regionOrContinent == "죄인들의낙원도원경"
    ) {
      region = "ShangriLa";
    }
    // 아르테리아
    else if (
      regionOrContinent == "아르테리아" ||
      regionOrContinent == "전함아르테리아"
    ) {
      region = "Arteria";
    }
    // 아케인리버
    else if (
      regionOrContinent == "아케인리버" ||
      regionOrContinent == "아케인"
    ) {
      continent = "ArcaneRiver";
    }
    // 테네브리스
    else if (regionOrContinent == "테네브리스" || regionOrContinent == "테네") {
      continent = "Tenebris";
    }
    // 그란디스
    else if (regionOrContinent == "그란디스") {
      continent = "Grandis";
    }
    // 미입력
    else if (_.isEmpty(regionOrContinent)) {
      //
    }
    // 뭔가 입력
    else {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "지원하지않는 지역입니다.",
        senderInfo,
        client,
      });
      return;
    }
    let subCount = chatSplit[2] || 0;
    try {
      subCount = parseInt(subCount);
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "서브 퀘스트 횟수를 잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let url = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/exp/quest`;

    let requestBody = {
      level: chatSplit[0],
      region,
      continent,
      subCount,
    };

    try {
      let response = await axios.post(url, requestBody);
      let responseData = _.get(response, "data");
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: `${level}에서 일일퀘스트 완료 시 ${responseData}% 상승`,
        senderInfo,
        client,
      });
      return;
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: e.response.data,
        senderInfo,
        client,
      });
      return;
    }
  } else if (command == COMMAND.MONSTER_PARK) {
    let url = `http://${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/exp/monsterpark`;

    let level = chatSplit[0];
    try {
      level = parseInt(level);
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "레벨을 잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let requestBody = {
      level: chatSplit[0],
    };

    try {
      let response = await axios.post(url, requestBody);
      let responseData = _.get(response, "data");
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: `${level}에서 몬스터파크 완료 시 ${responseData}% 상승`,
        senderInfo,
        client,
      });
      return;
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: e.response.data,
        senderInfo,
        client,
      });
      return;
    }
  }
}

module.exports = {
  exec,
};
