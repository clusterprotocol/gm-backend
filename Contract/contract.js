const { JsonRpcProvider, WebSocketProvider, Wallet, Contract } = require("ethers");
const clusterABI = require("./clusterABI.json");
require("dotenv").config();

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const ALCHEMY_WEBSOCKET_KEY = process.env.ALCHEMY_WEBSOCKET_KEY;
const clusterAddress = process.env.CONTRACT_ADDRESS;

// Debugging: Log environment variables to verify they are loaded correctly
console.log('SERVER_PRIVATE_KEY:', SERVER_PRIVATE_KEY);
console.log('ALCHEMY_KEY:', ALCHEMY_KEY);
console.log('ALCHEMY_WEBSOCKET_KEY:', ALCHEMY_WEBSOCKET_KEY);
console.log('CONTRACT_ADDRESS:', clusterAddress);

if (!SERVER_PRIVATE_KEY) {
  throw new Error("SERVER_PRIVATE_KEY is not set in the environment variables.");
}

const clusterContract = () => {
  const provider = new JsonRpcProvider(
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
  );

  const wallet = new Wallet(SERVER_PRIVATE_KEY);
  const connectedWallet = wallet.connect(provider);

  const contract = new Contract(
    clusterAddress,
    clusterABI,
    connectedWallet
  );

  return { contract, provider, wallet };
};

const clusterContractWS = () => {
  const websocketProvider = new WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_WEBSOCKET_KEY}`
  );

  const wallet = new Wallet(SERVER_PRIVATE_KEY);
  const connectedWalletWS = wallet.connect(websocketProvider);

  const contractWS = new Contract(
    clusterAddress,
    clusterABI,
    connectedWalletWS
  );

  return { contractWS };
};

module.exports = {
  clusterContractInstance: clusterContract,
  clusterContractWSInstance: clusterContractWS,
};
