const mongoose = require('mongoose');

const roomSchema = require('./room');
const commonSchema = require('./common');

// const Selection = mongoose.model('Selection', selectionSchema);

module.exports = {
    Room: roomSchema,
    Common: commonSchema,
}