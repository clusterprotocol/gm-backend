const {
  findApiKeyByUserAddress,
  createApiKey,
  deleteApiKeyByKey,
} = require("../dao/apiKeyDAO.js");
const crypto = require("crypto");

// Generate API Key
const generateApiKey = async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ message: "User address is required" });
    }

    // Check if the userAddress already exists in the database
    const existingKey = await findApiKeyByUserAddress(userAddress);

    if (existingKey) {
      // Return existing API key
      return res.json({ apiKey: existingKey.key });
    }

    // Generate new API key
    const apiKey = crypto.randomBytes(32).toString("hex");
    const newApiKey = await createApiKey(userAddress, apiKey);

    res.json({ apiKey: newApiKey.key });
  } catch (error) {
    console.error("Error generating API key:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Revoke API Key
const revokeApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ message: "API key is required" });
    }

    const result = await deleteApiKeyByKey(apiKey);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "API key not found" });
    }

    res.json({ message: "API key revoked" });
  } catch (error) {
    console.error("Error revoking API key:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { generateApiKey, revokeApiKey };
