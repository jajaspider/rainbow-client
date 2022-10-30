const mongoose = require('mongoose');

// Define Schemes
const permissionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create Model & Export
module.exports = mongoose.model('Permission', permissionSchema);