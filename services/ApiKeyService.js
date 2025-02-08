const crypto = require("crypto");
const ApiKeyDAO = require("../dao/ApiKeyDAO");

class ApiKeyService {
  // Generate or retrieve an API key for a user
  static async generateApiKey(userAddress) {
    const existingKey = await ApiKeyDAO.findByUserAddress(userAddress);

    if (existingKey) {
      return existingKey.key;
    }

    const apiKey = crypto.randomBytes(32).toString("hex");
    const newApiKey = await ApiKeyDAO.create(userAddress, apiKey);

    return newApiKey.key;
  }

  // Revoke an API key
  static async revokeApiKey(apiKey) {
    const result = await ApiKeyDAO.deleteByKey(apiKey);
    return result.deletedCount > 0;
  }
}

module.exports = ApiKeyService;
