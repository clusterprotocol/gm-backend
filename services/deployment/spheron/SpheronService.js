const spheronClientPromise = require("../../../config/cloudConfigs/spheronConfig.js");
const env = require("../../../config/env.js");
const fileUtils = require("../../../utils/fileUtils.js");

class SpheronService {
  constructor() {
    this.providerProxyUrl = env.PROVIDER_PROXY_URL;
  }

  async initializeClient() {
    if (!this.spheronClient) {
      this.spheronClient = await spheronClientPromise;
    }
    return this.spheronClient;
  }

  async deploy() {
    const spheronClient = await this.initializeClient();
    const fileContent = fileUtils.readGpuYml();

    try {
      const response = await spheronClient.deployment.createDeployment(
        fileContent,
        this.providerProxyUrl
      );
      return {
        success: true,
        message: "Deployment initiated successfully.",
        deploymentId: response.leaseId,
        url: response.url,
      };
    } catch (error) {
      return {
        success: false,
        message: "Deployment failed.",
        error: error.message,
      };
    }
  }

  async getDeploymentDetails(deploymentId) {
    try {
      const spheronClient = await this.initializeClient();
      const deploymentDetails = await spheronClient.deployment.getDeployment(
        deploymentId,
        this.providerProxyUrl
      );
      return {
        success: true,
        message: "Deployment details retrieved successfully.",
        deploymentDetails,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch deployment details.",
        error: error.message,
      };
    }
  }

  async closeDeployment(deploymentId) {
    try {
      const spheronClient = await this.initializeClient();
      const response = await spheronClient.deployment.closeDeployment(
        deploymentId
      );
      return {
        success: true,
        message: "Deployment cancelled successfully.",
        response,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to cancel deployment.",
        error: error.message,
      };
    }
  }

  async updateDeployment(deploymentId) {
    try {
      const spheronClient = await this.initializeClient();
      const fileContent = fileUtils.readGpuYml();
      const updatedDeployment = await spheronClient.deployment.updateDeployment(
        deploymentId,
        fileContent,
        this.providerProxyUrl
      );
      return {
        success: true,
        message: "Deployment updated successfully.",
        updatedDeployment,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update deployment.",
        error: error.message,
      };
    }
  }

  async getUserBalance(token, walletAddress) {
    try {
      const spheronClient = await this.initializeClient();
      const userBalance = await spheronClient.escrow.getUserBalance(
        token,
        walletAddress
      );
      return {
        success: true,
        message: "User balance retrieved successfully.",
        userBalance,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error retrieving user balance.",
        error: error.message,
      };
    }
  }

  async depositBalance(token, amount) {
    try {
      const spheronClient = await this.initializeClient();
      const depositReceipt = await spheronClient.escrow.depositBalance({
        token: token,
        amount: amount,
      });
      return {
        success: true,
        message: "Deposit completed successfully.",
        depositReceipt,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error during deposit process.",
        error: error.message,
      };
    }
  }

  async withdrawBalance(token, amount) {
    try {
      const spheronClient = await this.initializeClient();
      const withdrawReceipt = await spheronClient.escrow.withdrawBalance(
        token,
        amount
      );
      return {
        success: true,
        message: "Withdrawal completed successfully.",
        withdrawReceipt,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error during withdrawal process.",
        error: error.message,
      };
    }
  }

  async getLeaseDetails(leaseId) {
    try {
      const spheronClient = await this.initializeClient();
      const leaseDetails = await spheronClient.leases.getLeaseDetails(
        leaseId,
        this.providerProxyUrl
      );
      return {
        success: true,
        message: "Lease details retrieved successfully.",
        leaseDetails,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch lease details.",
        error: error.message,
      };
    }
  }

  async closeLease(leaseId) {
    try {
      const spheronClient = await this.initializeClient();
      const response = await spheronClient.leases.closeLease(leaseId);
      return {
        success: true,
        message: "Lease cancelled successfully.",
        response,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to cancel lease.",
        error: error.message,
      };
    }
  }

  async getLeaseIds(walletAddress) {
    try {
      // Wait for the spheronClient to be initialized
      const spheronClient = await this.initializeClient();

      const { activeLeaseIds, terminatedLeaseIds, allLeaseIds } =
        await spheronClient.leases.getLeaseIds(walletAddress);
      return {
        success: true,
        message: "Deployment updated successfully.",
        activeLeaseIds,
        terminatedLeaseIds,
        allLeaseIds,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update deployment.",
        error: error.message,
      };
    }
  }

  async getLeasesByState(walletAddress, options) {
    try {
      // Wait for the spheronClient to be initialized
      const spheronClient = await this.initializeClient();

      const leases = await spheronClient.leases.getLeaseIds(
        walletAddress,
        options
      );
      return {
        success: true,
        message: "Deployment updated successfully.",
        leases,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update deployment.",
        error: error.message,
      };
    }
  }
}

module.exports = SpheronService;
