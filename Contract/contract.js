const { ethers } = require("ethers");
const clusterABI = require("./clusterABI.json");
const env = require("../config/env");
require("dotenv").config();

class ClusterContract {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
    );
    this.wallet = new ethers.Wallet(env.SERVER_PRIVATE_KEY);
    this.connectedWallet = this.wallet.connect(this.provider);
    this.contract = new ethers.Contract(
      env.CONTRACT_ADDRESS,
      clusterABI,
      this.connectedWallet
    );
  }

  getContract() {
    return this.contract;
  }

  getProvider() {
    return this.provider;
  }

  getWallet() {
    return this.wallet;
  }
}

class ClusterContractWS {
  constructor() {
    this.websocketProvider = new ethers.WebSocketProvider(
      `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET_KEY}`
    );
    this.wallet = new ethers.Wallet(env.SERVER_PRIVATE_KEY);
    this.connectedWalletWS = this.wallet.connect(this.websocketProvider);
    this.contractWS = new ethers.Contract(
      env.CONTRACT_ADDRESS,
      clusterABI,
      this.connectedWalletWS
    );
  }

  getContract() {
    return this.contractWS;
  }
}

module.exports = {
  ClusterContract,
  ClusterContractWS,
};
