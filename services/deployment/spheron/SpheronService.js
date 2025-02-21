const spheronClientPromise = require("../../../config/cloudConfigs/spheronConfig.js");
const env = require("../../../config/env.js");
const CloudDAO = require("../../../dao/cloudDAO.js");
const fileUtils = require("../../../Utils/fileUtils.js");
const shellHelper = require("../../../helpers/shellHelpers.js");
const axios = require("axios");
const { cloudConfig } = require("../../../constants/cloudConfig.js");
const CommonFunction = require("../../../Utils/commonFunctions.js");
const ContainerService = require("../../containerServices/containerServices.js");

class SpheronService {
  constructor() {
    this.providerProxyUrl = env.PROVIDER_PROXY_URL;
    this.cloudDAO = new CloudDAO();
    this.commonFunctions = new CommonFunction();
    this.containerService = new ContainerService();
  }

  async initializeClient() {
    if (!this.spheronClient) {
      this.spheronClient = spheronClientPromise;
    }
    return this.spheronClient;
  }

  async createDeployment(deploymentData) {
    console.log("Spheron deploy running");
    const yamlConfig = this.cloudDAO.generateYamlConfigNew(deploymentData);
    shellHelper.saveYaml("gpu.yml", yamlConfig);
    const spheronClient = await this.initializeClient();
    const fileContent = fileUtils.readGpuYml();
    console.log("fileContent ", fileContent);

    try {
      const response = await spheronClient.client.deployment.createDeployment(
        fileContent,
        this.providerProxyUrl
      );
      console.log("Deployment Creation ", response);
      // ✅ Convert BigInt leaseId safely
      const deploymentId = Number(response?.leaseId);
      // ✅ Convert the entire response to remove BigInt values before saving to DB
      const safeDeploymentResponse = JSON.parse(
        JSON.stringify(response, (key, value) =>
          typeof value === "bigint" ? Number(value) : value
        )
      );
      return {
        success: true,
        message: "Deployment initiated successfully.",
        response: safeDeploymentResponse,
        deploymentId,
      };
    } catch (error) {
      console.log("error", error);
      const errorMessage = `Deployment Failed.\n\nPossible reasons:\n• Try increasing the bid price.\n• Choose another GPU with better availability.\n• Try again after some time.`;

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }
  }

  async fetchDeploymentDetails(deploymentId) {
    try {
      console.log("Spheron fetchDeploymentDetails ", deploymentId);
      const spheronClient = await this.initializeClient();
      const deploymentDetails =
        await spheronClient.client.deployment.getDeployment(
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

  async terminateDeployment(deploymentId) {
    try {
      const spheronClient = await this.initializeClient();
      const response = await spheronClient.client.deployment.closeDeployment(
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
      const updatedDeployment =
        await spheronClient.client.deployment.updateDeployment(
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

  async fetchUserBalance(token, walletAddress) {
    try {
      const spheronClient = await this.initializeClient();
      const userBalance = await spheronClient.client.escrow.getUserBalance(
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

  async saveDepositBalance(token, amount) {
    try {
      const spheronClient = await this.initializeClient();
      console.log("spheron deposit balance", token, amount);
      const depositReceipt = await spheronClient.client.escrow.depositBalance({
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
      console.log("withdraw Balance spheron ", token, amount);
      const withdrawReceipt = await spheronClient.client.escrow.withdrawBalance(
        {
          token,
          amount,
        }
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

  async fetchLeaseDetails(leaseId) {
    try {
      const spheronClient = await this.initializeClient();
      const leaseDetails = await spheronClient.client.leases.getLeaseDetails(
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

  async terminateLease(leaseId) {
    try {
      const spheronClient = await this.initializeClient();
      const response = await spheronClient.client.leases.closeLease(leaseId);
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

  async fetchLeaseIds(walletAddress) {
    try {
      // Wait for the spheronClient to be initialized
      const spheronClient = await this.initializeClient();

      const { activeLeaseIds, terminatedLeaseIds, allLeaseIds } =
        await spheronClient.client.leases.getLeaseIds(walletAddress);
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

  async fetchLeasesByState(walletAddress, options) {
    try {
      // Wait for the spheronClient to be initialized
      const spheronClient = await this.initializeClient();

      const leases = await spheronClient.client.leases.getLeaseIds(
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

  async fetchAvailableImages() {
    const response = await axios.get(
      "https://provider.spheron.network/api/gpu-prices"
    );
    const gpuImages = response.data;
    const processedData = gpuImages.map((gpu) => ({
      machineId: this.commonFunctions.generateRandomString(),
      availableNum: gpu.availableNum,
      cpuName: gpu.name,
      gpuName: gpu.name,
      portsOpen: [8080],
      region: gpu.region,
      bidPrice: gpu.averagePrice,
      cloudProvider: cloudConfig.SPHERON,
      instanceType: gpu.name,
      vcpu: gpu.vcpu || 24,
      memory: gpu.memory || 32,
      storage: gpu.storage || 200,
    }));
    return processedData;
  }
  async getLogs(data) {
    const deploymentId = data.deploymentId;
    console.log("spheron getLogs ", deploymentId);

    try {
      const command = `sphnctl deployment logs --lid ${parseInt(deploymentId)}`;
      const stdout = shellHelper.execCommand(command);

      console.log("STDOUT:", stdout);

      if (stdout.trim() === "") {
        console.log("No logs found. Marking deployment as offline.");
        this.cloudDAO.updateDeploymentStatus(deploymentId, "offline"); // Removed await
        return "";
      }

      return stdout;
    } catch (error) {
      console.error("Error fetching logs:", error.message);
      return { success: false, error: error.message };
    }
  }

  async getEvents(deploymentId) {
    console.log("spheron getEvents ", deploymentId);
    const command = `sphnctl deployment events --lid ${deploymentId}`;

    try {
      const stdout = shellHelper.execCommand(command);
      console.log("STDOUT:", stdout);

      if (stdout.trim() === "") {
        console.log("No events found. Marking deployment as offline.");
        this.cloudDAO.updateDeploymentStatus(deploymentId, "offline");
        return {
          success: true,
          message: `Events for Deployment ID: ${deploymentId}`,
          events: stdout,
          statusUpdated: "Offline",
        };
      }

      return {
        success: true,
        message: `Events for Deployment ID: ${deploymentId}`,
        events: stdout,
      };
    } catch (error) {
      console.error("Error fetching events:", error.message);
      return { success: false, error: error.message };
    }
  }

  async initiateContainerServices(deployment) {
    try {
      return {};
    } catch (error) {
      console.error("Error fetching public IP:", error);
      throw new Error(error.message);
    }
  }

  async fetchConnectionData(deploymentId) {
    try {
      const deploymentData = await this.fetchDeploymentDetails(deploymentId);
      console.log("deploymentDetails ", deploymentData);
      return deploymentData.deploymentDetails;
    } catch (error) {
      console.error("Error fetching public IP:", error);
      throw new Error(error.message);
    }
  }
}

module.exports = SpheronService;
