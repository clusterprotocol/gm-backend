const ApiKey = require("../models/apiKey");

// Find API key by user address
const findApiKeyByUserAddress = async (userAddress) => {
  return await ApiKey.findOne({ userAddress });
};

// Create new API key
const createApiKey = async (userAddress, key) => {
  const newApiKey = new ApiKey({ userAddress, key });
  return await newApiKey.save();
};

// Delete API key by key
const deleteApiKeyByKey = async (key) => {
  return await ApiKey.deleteOne({ key });
};

module.exports = { findApiKeyByUserAddress, createApiKey, deleteApiKeyByKey };
