require("dotenv").config();

const env = {
  SERVER_PRIVATE_KEY: process.env.SERVER_PRIVATE_KEY,
  INFURA_KEY: process.env.INFURA_KEY,
  MONGO_URL: process.env.MONGO_URL,
  ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  ALCHEMY_WEBSOCKET_KEY: process.env.ALCHEMY_WEBSOCKET_KEY,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  JWTSECRET: process.env.JWTSECRET,
};

module.exports = env;
