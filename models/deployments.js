// models/Deployment.js
const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  deploymentid: { type: Number, required: true },
  dockerImage: { type: String, required: true },
  duration: { type: String, required: true },
  cpuname: { type: String },
  gpuname: { type: String },
  cpuVRam: { type: Number },
  totalRam: { type: Number },
  memorySize: { type: String },
  coreCount: { type: Number },
  ipAddr: { type: String },
  openedPorts: [Number],
  region: { type: String },
  bidprice: { type: Number },
  walletAddress: { type: String, required: true },
  status: { type: String, default: "Active" },
  data: {type: Object},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Deployment", deploymentSchema);
