const ApiKey = require("../models/apiKey");

class ApiKeyDAO {
  // Find API key by user address
  static async findByUserAddress(userAddress) {
    return await ApiKey.findOne({ userAddress });
  }

  // Create a new API key
  static async create(userAddress, key) {
    const newApiKey = new ApiKey({ userAddress, key });
    return await newApiKey.save();
  }

  // Delete API key by key
  static async deleteByKey(key) {
    return await ApiKey.deleteOne({ key });
  }
}

module.exports = ApiKeyDAO;
