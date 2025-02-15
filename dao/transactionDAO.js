const Transaction = require("../models/transaction");

class TransactionDAO {
  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      return await transaction.save();
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async getTransactionsByUser(userAddress) {
    try {
      return await Transaction.find({ userAddress }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  async getTransactionById(transactionId) {
    try {
      return await Transaction.findById(transactionId);
    } catch (error) {
      console.error("Error fetching transaction by ID:", error);
      throw error;
    }
  }

  async getTransactionsByDeployment(deploymentId) {
    try {
      return await Transaction.find({ deploymentId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching transactions by deployment:", error);
      throw error;
    }
  }
}

module.exports = new TransactionDAO();
