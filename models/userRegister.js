const mongoose = require('mongoose');

const userRegisterSchema = new mongoose.Schema({
    name: String,
    userAddress: String ,
    sshKey: String,
    success: { type: Boolean, default: false }
    }, 
    { collection: 'userRegister', versionKey: false, timestamps: true }
);

const userRegister = mongoose.model('userRegister', userRegisterSchema);

module.exports = userRegister;