const mongoose = require('mongoose');

// Define Schemes
const manageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    alias: {
        type: Array,
        required: true
    },
    params: {
        type: mongoose.Mixed,
        required: false
    },
}, {
    timestamps: true
});

// Create Model & Export
module.exports = mongoose.model('Manage', manageSchema);