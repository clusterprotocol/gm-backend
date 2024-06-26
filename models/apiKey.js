const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    userAddress: {
        type: String,
        required: true,
        unique: true
    }
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
