const rabbitMQ = require('../core/rabbitmq');



class mqService {
    constructor() {
        this.init();
    }
    async init() {
        await rabbitMQ.assertExchange('rainbow', 'topic');
        await rabbitMQ.assertQueue('kakao');
        await rabbitMQ.bindQueue('kakao', 'rainbow', 'kakao');
        await rabbitMQ.consumeQueue('kakao', async (channel) => {
            // console.dir(channel);
            await channel.ack();
            console.dir(channel.content.toString());


        })

    }
}

const MQ = new mqService();

module.exports = MQ;