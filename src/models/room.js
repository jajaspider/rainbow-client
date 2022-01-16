const mongoose = require('mongoose');

// Define Schemes
const roomSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

// Create Model & Export
module.exports = mongoose.model('Room', roomSchema);