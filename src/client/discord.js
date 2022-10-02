const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const _ = require('lodash');
const {
    Client,
    Intents
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

const discordClient = new DISCORDCLIENT();
discordClient.init();

module.exports = discordClient.CLIENT;