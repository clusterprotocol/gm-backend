// models/Deployment.js
const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true },
  dockerImage: { type: String, required: true },
  duration: { type: String, required: true },
  name: { type: String, required: true },
  cloudProvider: { type: String, required: true },
  cpuname: { type: String },
  gpuname: { type: String },
  cpuVRam: { type: Number },
  totalRam: { type: Number },
  memorySize: { type: String },
  coreCount: { type: Number },
  ipAddr: { type: String },
  openedPorts: [Object],
  region: { type: String },
  bidprice: { type: Number },
  walletAddress: { type: String, required: true },
  status: { type: String, default: "Active" },
  data: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  env: { type: [Object], default: [] },
  publicKey: { type: String },
  deductionCost: {
    type: Object,
    default: {
      totalCost: 0,
      fromWallet: 0,
      fromAccount: 0,
      tokenAddress: "",
      refund: 0,
    },
  },
  containerData: { type: Object, default: {} },
});

module.exports = mongoose.model("Deployment", deploymentSchema);
