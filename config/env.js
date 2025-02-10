require("dotenv").config();

const env = {
  SERVER_PRIVATE_KEY: process.env.SERVER_PRIVATE_KEY,
  INFURA_KEY: process.env.INFURA_KEY,
  MONGO_URL: process.env.MONGO_URL,
  ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  ALCHEMY_WEBSOCKET_KEY: process.env.ALCHEMY_WEBSOCKET_KEY,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  JWTSECRET: process.env.JWTSECRET,
  SPHERON_PRIVATE_KEY: process.env.SPHERON_PRIVATE_KEY,
  PROVIDER_PROXY_URL: process.env.PROVIDER_PROXY_URL,
  SPHERON_ADDRESS: process.env.SPHERON_ADDRESS,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  AWS_REGION: process.env.AWS_REGION,
};

module.exports = env;
