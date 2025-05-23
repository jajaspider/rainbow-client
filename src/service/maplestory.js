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
  COOLDOWN: "cooldown",
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
        `${_.get(config, "site.domain")}:${_.get(
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
      requestUrl = `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/info/${encodeURIComponent(nickname)}`;
    } else {
      requestUrl = `${_.get(config, "site.domain")}:${_.get(
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

    let nickName = _.get(responseData, "character_name");
    let pop = _.get(responseData, "popularity");
    let job = _.get(responseData, "character_class");
    let level = _.get(responseData, "character_level");
    let exp = _.get(responseData, "character_exp_rate");
    let guild = _.get(responseData, "character_guild_name");
    // let server = server;

    let finalStat = _.get(responseData, "final_stat");
    let attackPower =
      _.get(_.find(finalStat, { stat_name: "전투력" }), "stat_value") || 0;
    let dojangStair = _.get(responseData, "dojang_best_floor");
    let dojangTime = _.get(responseData, "dojang_best_time");

    // let currentRanking = _.get(responseData, "ranking.current");
    // let changeRanking = _.get(responseData, "ranking.change");

    // let seedStair = _.get(responseData, "seed.stair", "-");
    // let seedTime = _.get(responseData, "seed.time", "-");

    /*
      character_thumbnail: _.get(character, "img"),
      // server_thumbnail: _.pick(character, 'img'),
      server_thumbnail: _.get(character, "worldSrc"),
      */

    let info = `${nickName}(${pop}) | ${job}\n`;
    info += `레벨 : ${level} - ${exp}%\n`;
    info += `길드 : ${guild}\n`;
    info += `전투력 : ${attackPower}\n`;
    // info += `랭킹 : ${currentRanking}(${changeRanking})\n\n`;
    info += `무릉도장 : ${dojangStair}층(${dojangTime})`;

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

    let requestUrl = `${_.get(config, "site.domain")}:${_.get(
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
      url: `${_.get(config, "site.domain")}:${_.get(
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
      data: responseData,
      senderInfo,
      client,
    });
  }
  // !무토
  else if (command == COMMAND.MUTO) {
    // chatEvent.emit("send", {
    //   channelId,
    //   type: "chat",
    //   data: "미지원",
    //   senderInfo,
    //   client,
    // });
    // return;

    if (chat == null || chatLength > 1) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let url = `${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/images/muto/${encodeURIComponent(chat)}`;
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

    let image = _.get(response, "data.payload.image");

    let templateId = 100327;
    let templateArgs = {
      imageUrl: `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/${image.imageUrl.split("/")[0]}/${encodeURIComponent(
        image.imageUrl.split("/")[1]
      )}`,
      imageW: image.imageW,
      imageH: image.imageH,
    };
    if (client == "kakao-remote") {
      chatEvent.emit("send", {
        channelId,
        type: "kakaolink",
        data: {
          templateId,
          templateArgs,
        },
        senderInfo,
        client,
      });
    }
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
      url = `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/selection/maple/class`;
    } else if (chatLength == 1) {
      url = `${_.get(config, "site.domain")}:${_.get(
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
      url = `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/union/${encodeURIComponent(nickname)}`;
    } else if (chatLength == 1) {
      url = `${_.get(config, "site.domain")}:${_.get(
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

    for (let _data of responseData) {
      let nickName = _.get(_data, "character_name");
      let unionRanking = _.get(_data, "ranking");
      let unionLevel = _.get(_data, "union_level");
      let unionPower = _.get(_data, "union_power");
      let unionCoinPerDay = Math.round((unionPower * 8.64) / 10000000);

      let message = `[${nickName}님의 유니온 정보]\n`;
      message += `랭킹 : ${unionRanking}\n`;
      message += `레벨 : ${unionLevel}\n`;
      message += `공격력 : ${unionPower}\n`;
      message += `일일 코인 획득량 : ${unionCoinPerDay}`;

      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: message,
        senderInfo,
        client,
      });
    }

    return;
  }
  // !이벤트
  else if (command == COMMAND.EVENT_LIST) {
    let maplestoryEndpoint = "https://maplestory.nexon.com";

    let url = `${_.get(config, "site.domain")}:${_.get(
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

    let url = `${_.get(config, "site.domain")}:${_.get(
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
    let arteriaMeso = _.get(symbolData, "arteriaMeso");
    arteriaMeso = arteriaMeso.toLocaleString();
    let carcionMeso = _.get(symbolData, "carcionMeso");
    carcionMeso = carcionMeso.toLocaleString();

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
    symbolInfo += `\n아르테리아 필요 메소 : ${arteriaMeso}`;
    symbolInfo += `\n카르시온 필요 메소 : ${carcionMeso}`;

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

    let url = `${_.get(config, "site.domain")}:${_.get(
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
    // 카르시온
    else if (regionOrContinent == "카르시온") {
      region = "Carcion";
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

    let url = `${_.get(config, "site.domain")}:${_.get(
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
    if (chatLength < 1 || chatLength > 3) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    // chat의 길이가1이면 익몬, 그외 2,3이면 일반 몬파
    let url = null;
    if (chatLength == 1) {
      url = `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/exp/extrememonsterpark`;
    } else {
      url = `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/maplestory/exp/monsterpark`;
    }

    let level = chatSplit[0];
    let region = chatSplit[1];
    //익몬은 count가 입력되어있지않기때문에 1회로 취급하기위함
    let count = chatSplit[2] || 1;

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

    try {
      count = parseInt(count);
    } catch (e) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "횟수를 잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    //자동 경비 구역
    if (region == "자동경비구역") {
      region = "AutoSecurityArea";
    }
    // 이끼나무 숲
    else if (region == "이끼나무숲") {
      region = "MossyTreeForest";
    }
    // 하늘 숲 수련장
    else if (region == "하늘숲수련장") {
      region = "SkyForestTrainingCenter";
    }
    // 해적단의 비밀 기지
    else if (region == "해적단의비밀기지") {
      region = "SecretPirateHideout";
    }
    // 이계의 전장
    else if (region == "이계의전장") {
      region = "OtherworldBattleground";
    }
    // 외딴 숲 위험 지역
    else if (region == "외딴숲위험지역") {
      region = "DangerouslyIsolatedForest";
    }
    // 금지된 시간
    else if (region == "금지된시간") {
      region = "ForbiddenTime";
    }
    // 숨겨진 유적
    else if (region == "숨겨진유적") {
      region = "ClandestineRuins";
    }
    // 폐허가 된 도시
    else if (region == "폐허가된도시") {
      region = "RuinedCity";
    }
    // 죽은 나무의 숲
    else if (region == "죽은나무의숲") {
      region = "ForestofDeadTrees";
    }
    // 감시의 탑
    else if (region == "감시의탑") {
      region = "WatchmanTower";
    }
    // 용의 둥지
    else if (region == "용의둥지") {
      region = "DragonNest";
    }
    // 망각의 신전
    else if (region == "망각의신전") {
      region = "TempleofOblivion";
    }
    // 기사단의 요새
    else if (region == "기사단의요새") {
      region = "KnightStronghold";
    }
    // 원혼의 협곡
    else if (region == "원혼의협곡") {
      region = "SpiritValley";
    }
    // 여로
    else if (region == "여로" || region == "소멸의여로") {
      region = "VanishingJourney";
    }
    // 츄츄
    else if (region == "츄츄" || region == "츄츄아일랜드") {
      region = "ChuChu";
    }
    // 레헬른
    else if (region == "레헬른") {
      region = "Lachelein";
    }
    // 아르카나
    else if (region == "아르카나" || region == "알카") {
      region = "Arcana";
    }
    // 모라스
    else if (region == "모라스") {
      region = "Morass";
    }
    // 에스페라
    else if (region == "에스페라" || region == "에페") {
      region = "Esfera";
    }
    // 셀라스
    else if (region == "셀라스") {
      region = "Sellas";
    }
    // 문브릿지
    else if (region == "문브릿지" || region == "문브") {
      region = "Moonbridge";
    }
    // 미궁
    else if (region == "고통의미궁" || region == "미궁") {
      region = "Labyrinth";
    }
    // 리멘
    else if (region == "리멘") {
      region = "Limina";
    }

    let requestBody = {
      level,
      region,
    };

    try {
      let response = await axios.post(url, requestBody);
      // 서버로 부터 받은 정보가 없음 -> 잘못된 데이터 입력일 확률 높음
      if (response.status == 204) {
        chatEvent.emit("send", {
          channelId,
          type: "chat",
          data: "입력 값 확인",
          senderInfo,
          client,
        });
        return;
      }

      let responseData = _.get(response, "data");
      let raiseUpExp = responseData * count;
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: `${level}에서 몬스터파크 완료 시 ${raiseUpExp}% 상승`,
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
  } else if (command == COMMAND.COOLDOWN) {
    if (chatLength < 2 || chatLength > 3) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    // chat의 길이가1이면 익몬, 그외 2,3이면 일반 몬파
    let url = `${_.get(config, "site.domain")}:${_.get(
      config,
      "site.port"
    )}/api/v0/maplestory/util/cooldown`;

    let cooldown = chatSplit[0];
    let mercedes = chatSplit[1];
    //모자 쿨타임은 0일수도있음
    let hat = chatSplit[2] || 0;

    cooldown = _.toNumber(cooldown);
    if (_.isNaN(cooldown) || Math.sign(cooldown) != 1) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "스킬 쿨타임을 잘못 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    hat = _.toNumber(hat);
    if (_.isNaN(hat) || Math.sign(hat) != 1) {
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: "쿨뚝 수치를 입력하셨습니다.",
        senderInfo,
        client,
      });
      return;
    }

    let requestBody = {
      cooldown,
      mercedes,
      hat,
    };

    try {
      let response = await axios.post(url, requestBody);
      let responseData = _.get(response, "data");
      chatEvent.emit("send", {
        channelId,
        type: "chat",
        data: `${cooldown}초 스킬 쿨타임 계산 결과 : ${responseData}초`,
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
