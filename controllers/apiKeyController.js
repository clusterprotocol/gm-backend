const ApiKeyService = require("../services/ApiKeyService");

class ApiKeyController {
  // Generate API Key
  async generateApiKey(req, res) {
    try {
      const { userAddress } = req.body;

      if (!userAddress) {
        return res.status(400).json({ message: "User address is required" });
      }

      const apiKey = await ApiKeyService.generateApiKey(userAddress);
      res.json({ apiKey });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // Revoke API Key
  async revokeApiKey(req, res) {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const success = await ApiKeyService.revokeApiKey(apiKey);

      if (!success) {
        return res.status(404).json({ message: "API key not found" });
      }

      return res.json({ message: "API key revoked" });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}

module.exports = new ApiKeyController();
