const SpheronService = require("./SpheronService");

// **Wrapper Class to Rename Functions**
class SpheronServiceWrapper {
  constructor() {
    this.spheronService = new SpheronService();
  }

  async createDeployment() {
    return this.spheronService.deploy();
  }

  async fetchDeploymentDetails(deploymentId) {
    return this.spheronService.getDeploymentDetails(deploymentId);
  }

  async terminateDeployment(deploymentId) {
    return this.spheronService.closeDeployment(deploymentId);
  }

  async fetchLeaseDetails(leaseId) {
    return this.spheronService.getLeaseDetails(leaseId);
  }

  async terminateLease(leaseId) {
    return this.spheronService.closeLease(leaseId);
  }

  async fetchUserBalance(token, walletAddress) {
    return this.spheronService.getUserBalance(token, walletAddress);
  }

  async saveDepositBalance(token, amount) {
    return this.spheronService.depositBalance(token, amount);
  }

  async withdrawBalance(token, amount) {
    return this.spheronService.withdrawBalance(token, amount);
  }

  async fetchLeaseIds(walletAddress) {
    return this.spheronService.getLeaseIds(walletAddress);
  }

  async fetchLeasesByState(walletAddress, options) {
    return this.spheronService.getLeasesByState(walletAddress, options);
  }
}

// **Exporting the Renamed Class**
module.exports = SpheronServiceWrapper;
