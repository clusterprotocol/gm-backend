const { ethers } = require("ethers");
const GPUBillingABI = require("../Contract/artifacts/contracts/GPUBilling.sol/GPUBilling.json"); // Ensure ABI is correct
const env = require("../config/env");

const providerUrl = env.RPC_URL;
const contractAddress = env.DEPLOYED_ADDRESS;
const ownerPrivateKey = env.PRIVATE_KEY;

class GPUBillingService {
  constructor() {
    this.contractAddress = contractAddress;
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

  async deposit(tokenAddress, amount, senderAddress, recieverAddress) {
    console.log(
      "tokenAddress, amount, senderAddress, recieverAddress ",
      tokenAddress,
      amount,
      senderAddress,
      recieverAddress
    );
    try {
      // Get the ERC20 token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress, // Token address
        [
          "function transferFrom(address from, address to, uint256 value) external returns (bool)",
        ], // ERC20 ABI for transferFrom
        this.wallet // Signer
      );

      // ✅ Transfer tokens from user to the contract
      const tx = await tokenContract.transferFrom(
        senderAddress,
        recieverAddress, // ✅ Correct contract address
        amount
      );

      await tx.wait();
      // console.log("deposit ", tx);
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Deposit error:", error);
      return { success: false, error: error.message };
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

  async ownerWithdraw(tokenAddress, amount) {
    try {
      const finalAmount = ethers.parseUnits(`${amount}`, 18); // 20 tokens for a token with 18 decimals

      const tx = await this.contract.ownerWithdraw(tokenAddress, finalAmount);
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
      console.log("transaction ", transactions);
      const safeResult = transactions.map((transaction) =>
        transaction.map((value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
      return safeResult;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to retrieve transactions");
    }
  }
  async getAllTokens() {
    try {
      const [addresses, tokens] = await this.contract.getAllTokens();
      console.log(addresses, tokens);
      return addresses.map((address, index) => ({
        address,
        name: tokens[index].name,
        symbol: tokens[index].symbol,
        imageURL: tokens[index].imageURL,
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to retrieve transactions");
    }
  }
  async getUserBalance(user, token) {
    try {
      const [tokenAddresses, balances] = await this.contract.getUserBalances(
        user
      );

      return tokenAddresses.map((token, index) => ({
        tokenAddress: token,
        balance: balances[index].toString(),
      }));
    } catch (error) {
      console.error("Error fetching balances:", error);
      throw new Error("Failed to retrieve user balances");
    }
  }

  async getOwnerBalance(token) {
    try {
      const balance = await this.contract.getOwnerBalance(token);
      console.log("balance owner ", balance);
      return balance.toString();
    } catch (error) {
      console.error("Error fetching balances:", error);
      throw new Error("Failed to retrieve user balances");
    }
  }

  async subtractUserBalance(user, token, amount) {
    try {
      if (!user || !token || !amount || amount <= 0) {
        throw new Error("Invalid input parameters");
      }
      const amountInWei = ethers.parseUnits(amount.toString(), 18); // Adjust decimals if needed
      const tx = await this.contract.subtractUserBalance(
        user,
        token,
        amountInWei
      );
      await tx.wait();
      return { txHash: tx.hash, user, token, amount, success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async addUserBalance(user, token, amount) {
    try {
      if (!user || !token || !amount || amount <= 0) {
        throw new Error("Invalid input parameters");
      }

      const amountInWei = ethers.parseUnits(amount.toString(), 18); // Adjust decimals if needed

      const tx = await this.contract.addUserBalance(user, token, amountInWei);
      await tx.wait();

      return { success: true, txHash: tx.hash, user, token, amount };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async depositETH(amount, senderAddress) {
    try {
      const tx = await this.wallet.sendTransaction({
        to: this.contractAddress,
        value: ethers.parseEther(amount.toString()), // Convert amount to Wei
      });

      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("Deposit ETH error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GPUBillingService;
