const amqp = require('amqp-connection-manager');
const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const Permission = require("../../models/index").Permission;
const {
    chatEvent
} = require('../eventBridge');

class RabbitMQ {
    constructor() {
        this.configPath = path.join(process.cwd(), 'config', 'rainbow.develop.yaml');
        this.config = yaml.load(fs.readFileSync(this.configPath));
        this.mqConfig = _.get(this.config, 'rabbitmq');

        this.connection = amqp.connect([`amqp://rainbow:rainBow@${this.mqConfig.ip}:${this.mqConfig.port}`]);
        this.channelWrapper = this.connection.createChannel({
            json: true,
            setup: (channel) => {
                // `channel` here is a regular amqplib `ConfirmChannel`.
                return Promise.all([
                        channel.assertQueue('kakao', {
                            durable: true
                        }),
                        channel.assertExchange('rainbow', 'topic'),
                        channel.prefetch(1),
                        channel.assertQueue('notice.maplestory', {
                            durable: true
                        }),
                        channel.bindQueue('notice.maplestory', 'rainbow', 'notice'),
                        channel.consume('notice.maplestory', mapleNoticeMessage)
                    ],
                    [
                        channel.assertQueue('kakao', {
                            durable: true
                        }),
                        channel.assertExchange('rainbow', 'topic'),
                        channel.prefetch(1),
                        channel.assertQueue('notice.lostark', {
                            durable: true
                        }),
                        channel.bindQueue('notice.lostark', 'rainbow', 'notice'),
                        channel.consume('notice.lostark', loaNoticeMessage)
                    ]
                )
            }
        });
    }

    async init() {
        await this.assertExchange(this.mqConfig.exchange, 'topic');
        // console.dir(this.channelWrapper);
    }

    async assertExchange(exchange, exchangeType) {
        await this.channelWrapper.assertExchange(exchange, exchangeType, {
            durable: true
        });
    }

    async bindQueue(queue, exchange, routingKey) {
        await this.channelWrapper.addSetup((channel) => {
            channel.bindQueue(queue, exchange, routingKey);
        })
    }

    async assertQueue(queue) {
        await this.channelWrapper.assertQueue(queue, {
            durable: true
        });
    }

    async sendToQueue(queue, data) {
        await this.channelWrapper.sendToQueue(queue, data);
    }

}

const rabbitMQ = new RabbitMQ();
rabbitMQ.init();

const mapleNoticeMessage = async (data) => {
    try {
        let message = JSON.parse(data.content.toString());
        // console.dir(message);

        let result = null;
        result = await Permission.find({
            type: 'maplestory',
        }).lean();
        let maplestoryRooms = _.map(result, (resultObj) => {
            return resultObj.id;
        });
        // console.dir(maplestoryRooms);
        for (let maplestoryRoom of maplestoryRooms) {
            // console.dir(maplestoryRoom);
            // chatEvent.emit('send', {
            //     channelId,
            //     type: 'chat',
            //     data: "추가 성공"
            // });
            let data = `${message.title}\n${message.url}`;
            chatEvent.emit('send', {
                channelId: maplestoryRoom,
                type: 'chat',
                data
            });
        }

        rabbitMQ.channelWrapper.ack(data);
        // channelWrapper.ack(data);
    } catch (e) {

    }

}

const loaNoticeMessage = async (data) => {
    try {
        let message = JSON.parse(data.content.toString());
        // console.dir(message);

        let result = null;
        result = await Permission.find({
            type: 'lostark',
        }).lean();
        let lostarkRooms = _.map(result, (resultObj) => {
            return resultObj.id;
        });
        for (let lostarkRoom of lostarkRooms) {
            // console.dir(maplestoryRoom);
            // chatEvent.emit('send', {
            //     channelId,
            //     type: 'chat',
            //     data: "추가 성공"
            // });
            let data = `${message.title}\n${message.url}`;
            chatEvent.emit('send', {
                channelId: lostarkRoom,
                type: 'chat',
                data
            });
        }

        rabbitMQ.channelWrapper.ack(data);
        // channelWrapper.ack(data);
    } catch (e) {

    }
}

module.exports = rabbitMQ;