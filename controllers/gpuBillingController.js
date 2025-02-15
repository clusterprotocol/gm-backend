const GPUBillingService = require("../services/gpuBillingService");

class GPUBillingController {
  constructor(providerUrl, contractAddress, ownerPrivateKey) {
    this.gpuBillingService = new GPUBillingService(
      providerUrl,
      contractAddress,
      ownerPrivateKey
    );
  }

  async addAllowedToken(req, res) {
    try {
      const { tokenAddress, name, symbol, imageURL } = req.body;
      const result = await this.gpuBillingService.addAllowedToken(
        tokenAddress,
        name,
        symbol,
        imageURL
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async removeAllowedToken(req, res) {
    try {
      const { tokenAddress } = req.body;
      const result = await this.gpuBillingService.removeAllowedToken(
        tokenAddress
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deposit(req, res) {
    try {
      const { tokenAddress, amount, userAddress } = req.body;
      const result = await this.gpuBillingService.deposit(
        tokenAddress,
        amount,
        userAddress
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async withdraw(req, res) {
    try {
      const { tokenAddress, amount, userAddress } = req.body;
      const result = await this.gpuBillingService.withdraw(
        tokenAddress,
        amount,
        userAddress
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactions(req, res) {
    try {
      const { userAddress } = req.params;
      const transactions = await this.gpuBillingService.getTransactions(
        userAddress
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GPUBillingController;
