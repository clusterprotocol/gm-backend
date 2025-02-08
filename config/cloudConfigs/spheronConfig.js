const env = require("../env");

class SpheronClient {
  constructor() {
    if (!SpheronClient.instance) {
      this.client = null;
      SpheronClient.instance = this;
    }
    return SpheronClient.instance;
  }

  async initialize() {
    if (!this.client) {
      const { SpheronSDK } = await import("@spheron/protocol-sdk");
      this.client = new SpheronSDK("testnet", env.SPHERON_PRIVATE_KEY);
    }
    return this.client;
  }
}

// Export a single instance of the class
const spheronClientInstance = new SpheronClient();
spheronClientInstance.initialize(); // Ensure initialization at startup

module.exports = spheronClientInstance;
