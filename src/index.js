// import {
//     AuthApiClient,
//     ChatBuilder,
//     KnownChatType,
//     MentionContent,
//     ReplyContent,
//     TalkClient
// } from 'node-kakao';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const _ = require('lodash');
const axios = require('axios');

const {
    router
} = require('./router');

const mongoose = require('mongoose');
const rabbitmq = require('./core/rabbitmq');
const {
    chatEvent,
    imageEvent
} = require('./core/eventBridge');
const download = require("image-downloader");
const FormData = require('form-data');
const {
    MessageEmbed,
    MessageAttachment
} = require('discord.js');

// const kakaoClient = require('../src/client/kakao');
const discordClient = require('../src/client/discord');

let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
let config = yaml.load(fs.readFileSync(configPath));

let mongo = _.get(config, 'mongo');
let mongoIp = _.get(mongo, 'ip');
let mongoPort = _.get(mongo, 'port');
let mongoDatabase = _.get(mongo, 'database');

mongoose
    .connect(`mongodb://${mongoIp}:${mongoPort}/${mongoDatabase}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('Successfully connected to mongodb'))
    .catch(e => {
        console.error(e);
        throw new Error('mongo DB connection fail');
    });


chatEvent.on('saveImage', async (payload) => {
    let channelId = _.get(payload, 'channelId');
    // 채널 이름 = channel.info.openLink.linkName;
    let channel = kakaoClient.CLIENT.channelList._open._map.get(channelId);
    const attachmentId = _.get(payload, 'attachmentId');
    const chat = _.get(payload, 'chat');
    const client = _.get(payload, 'client');

    let chatSplit = chat.split(" ");
    for (let i = 0; i < channel["_chatListStore"]["_chatList"].length; i += 1) {
        if (String(channel["_chatListStore"]["_chatList"][i].logId) != attachmentId) {
            continue;
        }
        //이미지 확장자
        let ext = String(
            channel["_chatListStore"]["_chatList"][i].attachment.url
        )
            .split("/")
            .reverse()[0]
            .split(".")
            .reverse()[0];
        let fileName = `${chatSplit[1]}.${ext}`;

        const options = {
            url: String(channel["_chatListStore"]["_chatList"][i].attachment.url),
            dest: path.join(process.cwd(), 'tempImage', fileName),
        };

        await download.image(options)
            .then(({
                filename
            }) => {
                fileName = filename;
            })
            .catch((err) => {
                //ignore
                console.dir(err);
            });

        const formData = new FormData();
        formData.append("file", fs.createReadStream(fileName));
        formData.append("type", chatSplit[0]);
        formData.append("name", chatSplit[1]);

        const requestConfig = {
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + formData.getBoundary()
            },
        }

        let response = await axios.post('http://sonaapi.com:30003/v0/images/upload', formData, requestConfig);
        responseData = _.get(response, "data");
        let image = _.get(responseData, 'payload.image');
        if (responseData.isSuccess) {
            imageEvent.emit('save', image);

            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '저장 성공',
                client
            });
        } else {
            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: '등록 실패',
                client
            });
        }
    }
});

chatEvent.on('send', async (payload) => {
    console.dir({
        method: 'chatEvent, send',
        payload
    }, {
        depth: null
    });
    /*
        chatEvent.emit('send', {
            channelId,
            type: 'chat',
            data: "추가 성공"
        }); 
    */
    let client = _.get(payload, 'client');
    let channelId = _.get(payload, 'channelId');
    const type = _.get(payload, 'type');
    if (client == 'kakao') {
        try {
            // 채널 이름 = channel.info.openLink.linkName;
            let channel = kakaoClient.CLIENT.channelList._open._map.get(channelId);
            if (!channel) {
                return;
            }

            if (type === 'chat') {
                let chat = _.get(payload, 'data');
                let result = await channel.sendChat(chat);
                if (!result.success) {
                    setTimeout(() => {
                        chatEvent.emit('send', payload);
                    }, 1000);
                }
            } else if (type === 'kakaolink') {
                // 2021.02 .06
                // 카링 재로그인 추가
                if (kakaoClient.kakaoLinkDate != new Date().getDate()) {
                    await kakaoClient.kakaoLogin();
                }

                payload = _.get(payload, 'data');
                let templateId = _.get(payload, 'templateId');
                let templateArgs = _.get(payload, 'templateArgs');
                await kakaoClient.kakaoLink.send(
                    `${channel.info.openLink.linkName}`, {
                    link_ver: '4.0',
                    template_id: templateId,
                    template_args: templateArgs
                }, 'custom');
            }

        } catch (e) {
            console.dir(e);
            setTimeout(() => {
                chatEvent.emit('send', payload);
            }, 1000);
        }
    } else if (client == 'discord') {
        const discordChannel = discordClient.channels.cache.get(channelId);
        if (!discordChannel) {
            return;
        }

        if (type === 'chat') {
            let chat = _.get(payload, 'data');
            discordChannel.send(chat);
        } else if (type === 'embed') {
            // console.dir(payload)
            let subType = _.get(payload, 'subType');
            if (subType == 'maplestoryInfo') {
                let character = _.get(payload, 'data');

                let embed = new MessageEmbed();
                embed.setColor('#0099ff');
                embed.setTitle(String(_.get(character, 'name')));
                embed.setURL(`https://maple.gg/u/${_.get(character, 'name')}`);
                embed.setDescription(`${_.get(character, 'level')} | ${_.get(character, 'class')}`);
                // embed.addField('직업', String(_.get(character, 'class')));
                embed.addField('경험치', `${String(_.get(character, 'exp'))}%`);
                embed.addField('랭킹', `${_.get(character, 'ranking.current')}(${_.get(character, 'ranking.change')})`);
                embed.addField('인기도', String(_.get(character, 'pop')));
                embed.addField('길드', String(_.get(character, 'guild')));
                // let img = String(_.get(character, 'img')).replace("180/", "");
                embed.setThumbnail('https://avatar.maplestory.nexon.com/Character/180/NLGIJLPOJJPICHGIENGEAIJADDCEFBGMAGLCJKOIGICKIGNLALDFOLOFDKKBOBDLHPBLHIFLJCALEAIAIFBMDKEJBDOLAGOEMHEJOGFLFCGHANKKCJJMOGIKKMNFMKCFCLGBILAKFOEHDDJKMKOECCEPPFNFGJNFACCOBHBLNCJLPNMCIOHEALPAIPMGEKCMBLPEOLIOKHNNKIFNACKBKCJHFHDMACFBMOPMDHNMLDHPABOAOFOMCELOKBPFFJBE.png');
                // embed.setImage('https://i.imgur.com/wSTFkRM.png');
                embed.addFields({
                    name: '무릉도장',
                    value: `${_.get(character, 'dojang.stair')} / ${_.get(character, 'dojang.time')}`,
                    inline: true
                }, {
                    name: '더시드',
                    value: `${_.get(character, 'seed.stair')} / ${_.get(character, 'seed.time')}`,
                    inline: true
                });
                console.dir(embed);

                discordChannel.send({
                    embeds: [embed]
                });
            } else if (subType == 'emoticon') {
                let image = _.get(payload, 'data');
                let embed = new MessageEmbed();
                // console.dir(`http://sonaapi.com:30003/${image.imageUrl}`);
                // embed.setImage(`http://sonaapi.com:30003/${image.imageUrl}`);
                let tempFileName = null;
                let imageUrl = `http://sonaapi.com:30003/${image.imageUrl}`;
                console.dir(imageUrl);
                // const options = {
                //     url: imageUrl,
                //     dest: path.join(process.cwd(), 'tempImage'),
                // };

                // await download.image(options).then(({
                //     filename
                // }) => {
                //     tempFileName = filename;
                // });
                // embed.attachFiles([tempFileName]);
                // console.dir(`attachment://${String(image.imageUrl).split("/")[1]}`);
                // let attachment = new MessageAttachment(path.join(process.cwd(), 'tempImage', String(image.imageUrl).split("/")[1]))
                embed.setTitle(`${(String(image.imageUrl).split("/")[1]).split(".")[0]}`)
                // embed.files = [attachment]
                // embed.image = {
                //     url: `attachment://${String(image.imageUrl).split("/")[1]}`
                // };
                embed.setImage(`http://sonaapi.com:30003/${image.imageUrl}`);
                discordChannel.send({
                    embeds: [embed],
                    // files: [path.join(process.cwd(), 'tempImage', String(image.imageUrl).split("/")[1])]
                })
            }

            // .setColor('#0099ff')
            // .setTitle('Some title')
            // .setURL('https://discord.js.org/')
            // .setDescription('Some description here')
            // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
            // .addFields({
            //     name: 'Regular field title',
            //     value: 'Some value here'
            // }, {
            //     name: '\u200B',
            //     value: '\u200B'
            // }, {
            //     name: 'Inline field title',
            //     value: 'Some value here',
            //     inline: true
            // }, {
            //     name: 'Inline field title',
            //     value: 'Some value here',
            //     inline: true
            // }, )
            // .addField('Inline field title', 'Some value here', true)
            // .setImage('https://i.imgur.com/wSTFkRM.png')
            // .setTimestamp()


            // discordChannel.send({
            //     embeds: [embed]
            // });
        }

    }

});

// kakaoClient.CLIENT.on('chat', async (data, channel) => {
//     const sender = data.getSenderInfo(channel);
//     if (!sender) return;

//     let channelId = _.get(channel, "_channel.channelId").toString();
//     let userId = null;
//     try {
//         userId = _.get(sender, 'linkId').toString();
//     } catch (e) {
//         // 오픈 프로필이 아니라면 userNumber는 null상태 유지
//     }

//     let nickname = _.get(sender, "nickname");
//     nickname = nickname.split('/')[0].trim();
//     let chat = data.text;
//     let attachmentId = null;
//     try {
//         attachmentId = String(data.chat["attachment"]["src_logId"]);
//     } catch (e) {
//         //ignore
//     }

//     const user = {
//         channelId,
//         userId,
//         nickname,
//         chat,
//         attachmentId,
//         client: 'kakao',
//     };

//     let imageObj = {
//         channelId,
//         chat,
//         client: 'kakao'
//     }

//     chatEvent.emit('receive', user);
//     imageEvent.emit('receive', imageObj);

//     // if (data.text === '안녕하세요') {
//     //     // 답장 형식
//     //     // 안녕하세요 @xxx
//     //     channel.sendChat(
//     //         new nodeKakao.ChatBuilder()
//     //         .append(new nodeKakao.ReplyContent(data.chat))
//     //         .text('안녕하세요 ')
//     //         .append(new nodeKakao.MentionContent(sender))
//     //         .build(nodeKakao.KnownChatType.REPLY));
//     //     // 일반 텍스트
//     //     // channel.sendChat('안녕하세요');
//     // }
// });

discordClient.on('messageCreate', async (msg) => {
    let isBot = _.get(msg, 'author.bot');
    if (isBot) {
        return;
    }
    // let guild = discordClient.guilds.get(msg.guildId);

    // console.dir(discordClient.guilds);
    // discordClient.guilds.get(msg.guildId)

    let channelId = _.get(msg, 'channelId');
    let chat = _.get(msg, 'content');
    let userId = _.get(msg, 'author.id');
    let nickname = (await msg.guild.members.fetch(userId)).nickname;
    if (chat == 'test') {
        let payload = {
            client: 'discord',
            channelId,
            type: 'embed'
        }
        chatEvent.emit('send', payload);
        return;
    }

    const user = {
        channelId,
        userId,
        nickname,
        chat,
        client: 'discord',
    };

    chatEvent.emit('receive', user);
});