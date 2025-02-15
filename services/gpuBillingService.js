const { ethers } = require("ethers");
const GPUBillingABI = require("../Contract/artifacts/contracts/GPUBilling.sol/GPUBilling.json"); // Ensure ABI is correct

class GPUBillingService {
  constructor(providerUrl, contractAddress, ownerPrivateKey) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.wallet = new ethers.Wallet(ownerPrivateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      GPUBillingABI.abi,
      this.wallet
    );
  }

  async addAllowedToken(tokenAddress, name, symbol, imageURL) {
    try {
      const tx = await this.contract.addAllowedToken(
        tokenAddress,
        name,
        symbol,
        imageURL
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error adding allowed token:", error);
      throw new Error("Failed to add allowed token");
    }
  }

  async removeAllowedToken(tokenAddress) {
    try {
      const tx = await this.contract.removeAllowedToken(tokenAddress);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Error removing token:", error);
      throw new Error("Failed to remove token");
    }
  }

  async deposit(tokenAddress, amount, userAddress) {
    try {
      const tokenContract = await this.contract.deposit(
        tokenAddress,
        amount,
        this.wallet
      );
      const tx = await tokenContract.transferFrom(
        userAddress,
        this.contract.target,
        amount
      );
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Deposit error:", error);
      throw new Error("Deposit failed");
    }
  }

  async withdraw(tokenAddress, amount, userAddress) {
    try {
      const tx = await this.contract.withdraw(tokenAddress, amount);
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Withdraw error:", error);
      throw new Error("Withdraw failed");
    }
  }

  async getTransactions(userAddress) {
    try {
      const transactions = await this.contract.getTransactions(userAddress);
      return transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to retrieve transactions");
    }
  }
}

module.exports = GPUBillingService;
