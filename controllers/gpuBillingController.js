const transactionDAO = require("../dao/transactionDAO");
const userDAO = require("../dao/userDAO");
const GPUBillingService = require("../services/gpuBillingService");

class GPUBillingController {
  constructor() {
    this.gpuBillingService = new GPUBillingService();
    this.userDAO = userDAO;
    this.transactionDAO = transactionDAO;
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
      const {
        tokenAddress,
        amount,
        senderAddress,
        recieverAddress,
        userAddress,
      } = req.body;
      const result = await this.gpuBillingService.deposit(
        tokenAddress,
        amount,
        senderAddress,
        recieverAddress
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

  async ownerWithdraw(req, res) {
    try {
      const { tokenAddress, amount } = req.body;
      const result = await this.gpuBillingService.ownerWithdraw(
        tokenAddress,
        amount
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

  async getAllTokens(req, res) {
    try {
      const tokens = await this.gpuBillingService.getAllTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserBalance(req, res) {
    try {
      const { user, token } = req.params;
      console.log(" user, token ", user, token);
      const balance = await this.gpuBillingService.getUserBalance(user, token);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOwnerBalance(req, res) {
    try {
      const { token } = req.body;
      console.log("token ", token);
      const balance = await this.gpuBillingService.getOwnerBalance(token);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addTokenIntoWallet(req, res) {
    try {
      const { deductionCost, txHash, approvedHash, userAddress } = req.body;

      const user = await this.userDAO.findUserByAddress(userAddress);
      if (!user) {
        res.status(404).json({ success: false, error: "User not found!!" });
      }
      console.log("user ", user);

      let previousBalance = JSON.parse(JSON.stringify(user.wallet.balance));
      let finalBalance =
        user.wallet.balance + parseFloat(deductionCost.fromAccount); // Subtract money
      user.wallet.balance = finalBalance;
      console.log("user ", user);

      await this.transactionDAO.createTransaction({
        userAddress,
        amount: deductionCost.totalCost,
        deploymentId: null,
        type: "credit",
        previousBalance,
        finalBalance,
        deductionCost,
        txHash: txHash.toString(),
        approvedHash: approvedHash.toString(),
        message: "Added into wallet from account",
      });

      await user.save();

      res.json({ success: true, message: "Token added into wallet" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GPUBillingController;
