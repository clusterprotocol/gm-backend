// Use dynamic import inside an async function to avoid errors with ESM
const env = require("../env");

async function initializeSpheron() {
  const { SpheronSDK } = await import("@spheron/protocol-sdk");
  const spheronClient = new SpheronSDK("testnet", env.SPHERON_PRIVATE_KEY);

  return spheronClient; // Directly return the client instance
}

// Export the promise that resolves to the client instance
module.exports = initializeSpheron();
