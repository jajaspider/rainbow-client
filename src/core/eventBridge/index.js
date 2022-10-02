const EventEmitter = require('events');

const chatEvent = new EventEmitter();
const imageEvent = new EventEmitter();
// const mapleEvent = new EventEmitter();
// const lostarkEvent = new EventEmitter();
// const commonEvent = new EventEmitter();

chatEvent.on('receive', (payload) => {
    console.dir(payload);
})

chatEvent.on('send', (payload) => {
    console.dir(payload);
})

module.exports = {
    chatEvent,
    imageEvent
    // commonEvent,
    // mapleEvent,
    // lostarkEvent
}