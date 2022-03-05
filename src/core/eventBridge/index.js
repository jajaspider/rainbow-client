const EventEmitter = require('events');

const chatEvent = new EventEmitter();
const imageEvent = new EventEmitter();
// const mapleEvent = new EventEmitter();
// const lostarkEvent = new EventEmitter();
// const commonEvent = new EventEmitter();

module.exports = {
    chatEvent,
    imageEvent
    // commonEvent,
    // mapleEvent,
    // lostarkEvent
}