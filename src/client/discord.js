const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const _ = require('lodash');
const {
    Client,
    Intents
} = require('discord.js');

class DISCORDCLIENT {
    constructor() {
        this.CLIENT = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
        });
        //, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS
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

discordClient.CLIENT.on('ready', () => {
    console.log(`Logged in as ${discordClient.CLIENT.user.tag}!`);
});

module.exports = discordClient.CLIENT;