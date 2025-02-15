// const { cloudConfig } = require("../../constants/cloudConfig.js");
// const spheronDeploymentService = require("./spheron/spheronDeploymentService.js");
// const spheronLeaseService = require("./spheron/spheronLeaseService.js");
// const spheronEscrowService = require("./spheron/spheronEscrowService.js");

// const deployApplication = async (deploymentData) => {
//   switch (cloudConfig[deploymentData.cloudProvider]) {
//     case "SPHERON":
//       return await spheronDeploymentService.deploy(deploymentData);
//     // case "AWS":
//     //   return await awsService.deploy(deploymentData);
//     // case "GCP":
//     //   return await gcpService.deploy(deploymentData);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const getDeploymentDetails = async (deploymentId, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronDeploymentService.getDeploymentDetails(deploymentId);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const closeDeployment = async (deploymentId, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronDeploymentService.closeDeployment(deploymentId);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const updateDeployment = async (deploymentId, updateData, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronDeploymentService.updateDeployment(
//         deploymentId,
//         updateData
//       );
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const getLeaseDetails = async (leaseId, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronLeaseService.getLeaseDetails(leaseId);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const closeLease = async (leaseId, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronLeaseService.closeLease(leaseId);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const getLeaseIds = async (walletAddress, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronLeaseService.getLeaseIds(walletAddress);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const getLeasesByState = async (walletAddress, options, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronLeaseService.getLeasesByState(walletAddress, options);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const getUserBalance = async (token, walletAddress, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronEscrowService.getUserBalance(token, walletAddress);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const depositBalance = async (token, amount, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronEscrowService.depositBalance(token, amount);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// const withdrawBalance = async (token, amount, cloudProvider) => {
//   switch (cloudConfig[cloudProvider]) {
//     case "SPHERON":
//       return await spheronEscrowService.withdrawBalance(token, amount);
//     default:
//       throw new Error("Invalid cloud provider selected.");
//   }
// };

// module.exports = {
//   deployApplication,
//   closeDeployment,
//   updateDeployment,
//   getDeploymentDetails,
//   getLeaseDetails,
//   closeLease,
//   getLeaseIds,
//   getLeasesByState,
//   getUserBalance,
//   depositBalance,
//   withdrawBalance,
// };

const { cloudConfig } = require("../../constants/cloudConfig.js");
const AwsService = require("./aws/AwsService");
const SpheronService = require("./spheron/SpheronService.js");

class CloudService {
  constructor(cloudProvider) {
    this.cloudProvider = cloudConfig[cloudProvider];
    if (!this.cloudProvider) {
      throw new Error("Invalid cloud provider selected.");
    }

    switch (this.cloudProvider) {
      case "SPHERON":
        this.cloudService = new SpheronService();

        break;
      case "AWS":
        this.cloudService = new AwsService();
        break;
    }
  }
}

class ServiceProvider extends CloudService {
  async createDeployment(deploymentData) {
    return await this.cloudService.createDeployment(deploymentData);
  }

  async fetchDeploymentDetails(deploymentId) {
    return await this.cloudService.fetchDeploymentDetails(deploymentId);
  }

  async fetchAvailableImages() {
    return await this.cloudService.fetchAvailableImages();
  }

  async terminateDeployment(deploymentId) {
    return await this.cloudService.terminateDeployment(deploymentId);
  }

  async updateDeployment(deploymentId, updateData) {
    return await this.cloudService.updateDeployment(deploymentId, updateData);
  }

  async fetchUserBalance(token, walletAddress) {
    return await this.cloudService.fetchUserBalance(token, walletAddress);
  }

  async saveDepositBalance(token, amount) {
    return await this.cloudService.saveDepositBalance(token, amount);
  }

  async withdrawBalance(token, amount) {
    return await this.cloudService.withdrawBalance(token, amount);
  }

  async fetchLeaseDetails(leaseId) {
    return await this.cloudService.fetchLeaseDetails(leaseId);
  }

  async terminateLease(leaseId) {
    return await this.cloudService.terminateLease(leaseId);
  }

  async fetchLeaseIds(walletAddress) {
    return await this.cloudService.fetchLeaseIds(walletAddress);
  }

  async fetchLeasesByState(walletAddress, options) {
    return await this.cloudService.fetchLeasesByState(walletAddress, options);
  }

  async getLogs(deploymentId) {
    return await this.cloudService.getLogs(deploymentId);
  }

  async getEvents(deploymentId) {
    return await this.cloudService.getEvents(deploymentId);
  }
}

module.exports = ServiceProvider;
