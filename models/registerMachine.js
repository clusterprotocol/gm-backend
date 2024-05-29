const mongoose = require('mongoose');

const registerMachineSchema = new mongoose.Schema({
    cpuname:String,
    gpuname:String,
    spuVRam:Number,
    totalRam:Number,
    memorySize:Number,
    coreCount:Number,
    ipAddr:String,
    openedPorts:[Number],
    region:String,
    bidprice:Number,
    walletAddress:String
    }, 
    { collection: 'RegisterMachine', versionKey: false, timestamps: true }
);

const RegisterMachine = mongoose.model('RegisterMachine', registerMachineSchema);

module.exports = RegisterMachine;
