const env = require("../config/env");

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 11155111,
    },
    sepolia: {
      url: env.RPC_URL,
      accounts: [env.PRIVATE_KEY],
    },
  },
};
