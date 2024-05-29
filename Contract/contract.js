const { ethers } = require("ethers");
const clusterABI = require("./clusterABI.json");
require('dotenv').config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const clusterAddress = process.env.CONTRACT_ADDRESS;


const clusterContract = () => {

    const provider = new ethers.providers.JsonRpcProvider(
        `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
    );
    
    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY);
    const connectedWallet = wallet.connect(provider);

    const clusterContract = new ethers.Contract(
        clusterAddress,
        clusterABI,
        connectedWallet
      );

    return {clusterContract,provider,wallet};

}

const clusterContractWS = () => {

    const websocketProvider = new ethers.providers.WebSocketProvider(
        `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET_KEY}`
    );

    const wallet = new ethers.Wallet(SERVER_PRIVATE_KEY);
    const connectedWalletWS = wallet.connect(websocketProvider);

    const clusterContractWS = new ethers.Contract(
        clusterAddress,
        clusterABI,
        connectedWalletWS
    );

    return {clusterContractWS};

}

module.exports = {
    clusterContractInstance:clusterContract,
    clusterContractWSInstance:clusterContractWS,
}