const mongoose = require('mongoose');

// Define Schemes
const roomSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    notice: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

// Create Model & Export
module.exports = mongoose.model('Room', roomSchema);