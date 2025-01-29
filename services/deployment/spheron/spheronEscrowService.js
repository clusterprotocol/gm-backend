const spheronClientPromise = require("../../../config/cloudConfigs/spheronConfig.js");
const env = require("../../../config/env.js");

const getUserBalance = async (token, walletAddress) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const userBalance = await spheronClient.escrow.getUserBalance(
      token,
      walletAddress
    );
    return {
      success: true,
      message: "User balance retrieved successfully.",
      userBalance,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error retrieving user balance.",
      error: error.message,
    };
  }
};

const depositBalance = async (token, amount) => {
  try {
    const depositeReciept = await spheronClient.escrow.depositBalance({
      token: token,
      amount: amount,
    });
    return {
      success: true,
      message: "Deposit completed successfully.",
      depositeReciept,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error during deposit process.",
      error: error.message,
    };
  }
};

const withdrawBalance = async (token, amount) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const withdrawReciept = await spheronClient.escrow.withdrawBalance(
      walletAddress
    );
    return {
      success: true,
      message: "Withdrawal completed successfully.",
      withdrawReciept,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error during withdrawal process.",
      error: error.message,
    };
  }
};

module.exports = {
  getUserBalance,
  depositBalance,
  withdrawBalance,
};
