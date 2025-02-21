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

  async getLogs(data) {
    return await this.cloudService.getLogs(data);
  }

  async getEvents(deploymentId) {
    return await this.cloudService.getEvents(deploymentId);
  }

  async initiateContainerServices(deployment) {
    return await this.cloudService.initiateContainerServices(deployment);
  }

  async fetchConnectionData(deploymentId) {
    return await this.cloudService.fetchConnectionData(deploymentId);
  }
}

module.exports = ServiceProvider;
