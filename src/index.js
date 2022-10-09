const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const _ = require('lodash');
const mongoose = require('mongoose');

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

require('./router');
require('./client');

// chatEvent.on('send', async (payload) => {
//     console.dir({
//         method: 'chatEvent, send',
//         payload
//     }, {
//         depth: null
//     });
//     /*
//         chatEvent.emit('send', {
//             channelId,
//             type: 'chat',
//             data: "추가 성공"
//         });
//     */
//     let client = _.get(payload, 'client');
//     let channelId = _.get(payload, 'channelId');
//     const type = _.get(payload, 'type');
//     // if (client == 'kakao') {
//     //     // return;
//     //     try {
//     //         // 채널 이름 = channel.info.openLink.linkName;
//     //         let channel = kakaoClient.CLIENT.channelList._open._map.get(channelId);
//     //         if (!channel) {
//     //             return;
//     //         }

//     //         if (type === 'chat') {
//     //             let chat = _.get(payload, 'data');
//     //             let result = await channel.sendChat(chat);
//     //             if (!result.success) {
//     //                 setTimeout(() => {
//     //                     chatEvent.emit('send', payload);
//     //                 }, 1000);
//     //             }
//     //             let next = _.get(payload, 'data.next');
//     //             if (next != null) {
//     //                 chatEvent.emit('send', {
//     //                     channelId,
//     //                     type: 'chat',
//     //                     data: next,
//     //                     client
//     //                 });
//     //             }
//     //         } else if (type === 'kakaolink') {
//     //             // 2021.02 .06
//     //             // 카링 재로그인 추가
//     //             if (kakaoClient.kakaoLinkDate != new Date().getDate()) {
//     //                 await kakaoClient.kakaoLogin();
//     //             }

//     //             payload = _.get(payload, 'data');
//     //             let templateId = _.get(payload, 'templateId');
//     //             let templateArgs = _.get(payload, 'templateArgs');
//     //             await kakaoClient.kakaoLink.send(
//     //                 `${channel.info.openLink.linkName}`, {
//     //                 link_ver: '4.0',
//     //                 template_id: templateId,
//     //                 template_args: templateArgs
//     //             }, 'custom');

//     //             let next = _.get(payload, 'next');
//     //             if (next != null) {
//     //                 chatEvent.emit('send', {
//     //                     channelId,
//     //                     type: 'chat',
//     //                     data: next,
//     //                     client
//     //                 });
//     //             }
//     //         }

//     //     } catch (e) {
//     //         // console.dir(e);
//     //         setTimeout(() => {
//     //             chatEvent.emit('send', payload);
//     //         }, 1000);
//     //     }
//     // } else
//     if (client == 'discord') {
//         const discordChannel = discordClient.channels.cache.get(channelId);
//         if (!discordChannel) {
//             return;
//         }

//         if (type === 'chat') {
//             let chat = _.get(payload, 'data');
//             discordChannel.send(chat);
//             let next = _.get(payload, 'data.next');
//             if (next != null) {
//                 chatEvent.emit('send', {
//                     channelId,
//                     type: 'chat',
//                     data: next,
//                     client
//                 });
//             }
//         } else if (type === 'embed') {
//             // console.dir(payload)
//             let subType = _.get(payload, 'subType');
//             if (subType == 'maplestoryInfo') {
//                 let character = _.get(payload, 'data');

//                 let embed = new MessageEmbed();
//                 embed.setColor('#0099ff');
//                 embed.setTitle(String(_.get(character, 'name')));
//                 embed.setURL(`https://maple.gg/u/${_.get(character, 'name')}`);
//                 embed.setDescription(`${_.get(character, 'level')} | ${_.get(character, 'class')}`);
//                 // embed.addField('직업', String(_.get(character, 'class')));
//                 embed.addField('경험치', `${String(_.get(character, 'exp'))}%`);
//                 embed.addField('랭킹', `${_.get(character, 'ranking.current')}(${_.get(character, 'ranking.change')})`);
//                 embed.addField('인기도', String(_.get(character, 'pop')));
//                 embed.addField('길드', String(_.get(character, 'guild')));
//                 // let img = String(_.get(character, 'img')).replace("180/", "");
//                 embed.setThumbnail('https://avatar.maplestory.nexon.com/Character/180/NLGIJLPOJJPICHGIENGEAIJADDCEFBGMAGLCJKOIGICKIGNLALDFOLOFDKKBOBDLHPBLHIFLJCALEAIAIFBMDKEJBDOLAGOEMHEJOGFLFCGHANKKCJJMOGIKKMNFMKCFCLGBILAKFOEHDDJKMKOECCEPPFNFGJNFACCOBHBLNCJLPNMCIOHEALPAIPMGEKCMBLPEOLIOKHNNKIFNACKBKCJHFHDMACFBMOPMDHNMLDHPABOAOFOMCELOKBPFFJBE.png');
//                 // embed.setImage('https://i.imgur.com/wSTFkRM.png');
//                 embed.addFields({
//                     name: '무릉도장',
//                     value: `${_.get(character, 'dojang.stair')} / ${_.get(character, 'dojang.time')}`,
//                     inline: true
//                 }, {
//                     name: '더시드',
//                     value: `${_.get(character, 'seed.stair')} / ${_.get(character, 'seed.time')}`,
//                     inline: true
//                 });

//                 discordChannel.send({
//                     embeds: [embed]
//                 });
//             } else if (subType == 'emoticon') {
//                 let image = _.get(payload, 'data');
//                 let embed = new MessageEmbed();
//                 // console.dir(`http://sonaapi.com:30003/${image.imageUrl}`);
//                 // embed.setImage(`http://sonaapi.com:30003/${image.imageUrl}`);
//                 let tempFileName = null;
//                 let imageUrl = `http://sonaapi.com:30003/${image.imageUrl}`;
//                 console.dir(imageUrl);
//                 // const options = {
//                 //     url: imageUrl,
//                 //     dest: path.join(process.cwd(), 'tempImage'),
//                 // };

//                 // await download.image(options).then(({
//                 //     filename
//                 // }) => {
//                 //     tempFileName = filename;
//                 // });
//                 // embed.attachFiles([tempFileName]);
//                 // console.dir(`attachment://${String(image.imageUrl).split("/")[1]}`);
//                 // let attachment = new MessageAttachment(path.join(process.cwd(), 'tempImage', String(image.imageUrl).split("/")[1]))
//                 embed.setTitle(`${(String(image.imageUrl).split("/")[1]).split(".")[0]}`)
//                 // embed.files = [attachment]
//                 // embed.image = {
//                 //     url: `attachment://${String(image.imageUrl).split("/")[1]}`
//                 // };
//                 embed.setImage(`http://sonaapi.com:30003/${image.imageUrl}`);
//                 discordChannel.send({
//                     embeds: [embed],
//                     // files: [path.join(process.cwd(), 'tempImage', String(image.imageUrl).split("/")[1])]
//                 })
//             }

//             // .setColor('#0099ff')
//             // .setTitle('Some title')
//             // .setURL('https://discord.js.org/')
//             // .setDescription('Some description here')
//             // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
//             // .addFields({
//             //     name: 'Regular field title',
//             //     value: 'Some value here'
//             // }, {
//             //     name: '\u200B',
//             //     value: '\u200B'
//             // }, {
//             //     name: 'Inline field title',
//             //     value: 'Some value here',
//             //     inline: true
//             // }, {
//             //     name: 'Inline field title',
//             //     value: 'Some value here',
//             //     inline: true
//             // }, )
//             // .addField('Inline field title', 'Some value here', true)
//             // .setImage('https://i.imgur.com/wSTFkRM.png')
//             // .setTimestamp()


//             // discordChannel.send({
//             //     embeds: [embed]
//             // });
//         }

//     } else if (client == 'kakao-remote') {
//         if (type === 'chat') {
//             let senderInfo = _.get(payload, 'senderInfo');
//             let message = _.get(payload, 'data');

//             kakaoRemote.emit('sendMessage', {
//                 senderInfo,
//                 message
//             })
//         }
//     }
// });