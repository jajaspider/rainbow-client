const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const _ = require('lodash');
const {
    Client,
    Intents,
    MessageEmbed
} = require('discord.js');

const {
    chatEvent
} = require('../core/eventBridge');

class DISCORDCLIENT {
    constructor() {
        this.CLIENT = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
        });
        //, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS

        this.CLIENT.on('ready', () => {
            console.log(`Logged in as ${discordClient.CLIENT.user.tag}!`);
        });

        this.CLIENT.on('messageCreate', async (msg) => {
            let isBot = _.get(msg, 'author.bot');
            if (isBot) {
                return;
            }

            let channelId = _.get(msg, 'channelId');
            let chat = _.get(msg, 'content');
            let userId = _.get(msg, 'author.id');
            let nickname = (await msg.guild.members.fetch(userId)).nickname;

            // if (chat == 'test') {
            //     let payload = {
            //         client: 'discord',
            //         channelId,
            //         type: 'embed'
            //     }
            //     chatEvent.emit('send', payload);
            //     return;
            // }

            const user = {
                channelId,
                userId,
                nickname,
                chat,
                client: 'discord',
            };

            chatEvent.emit('receive', user);
        });
    }

    async init() {
        let configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
        let config = yaml.load(fs.readFileSync(configPath));
        const token = _.get(config, 'discord.token');
        this.CLIENT.login(token);
    }
}

chatEvent.on('send', (payload) => {
    let channelId = _.get(payload, 'channelId');
    let client = _.get(payload, 'client');
    const type = _.get(payload, 'type');
    if (client != 'discord') {
        return;
    }

    const discordChannel = discordClient.CLIENT.channels.cache.get(channelId);
    if (!discordChannel) {
        return;
    }

    if (type === 'chat') {
        let chat = _.get(payload, 'data');
        discordChannel.send(chat);
        let next = _.get(payload, 'data.next');
        if (next != null) {
            chatEvent.emit('send', {
                channelId,
                type: 'chat',
                data: next,
                client
            });
        }
    }
    else if (type === 'embed') {
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

            discordChannel.send({
                embeds: [embed]
            });
        }
    }

});

const discordClient = new DISCORDCLIENT();
discordClient.init();

module.exports = discordClient.CLIENT;