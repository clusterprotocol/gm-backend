const SpheronService = require("../spheron/SpheronService");

// **Wrapper Class to Rename Functions**
class AwsServiceWrapper {
  constructor() {
    this.cloudService = new SpheronService();
  }

  async startDeployment() {
    return this.cloudService.deploy();
  }

  async fetchDeploymentDetails(deploymentId) {
    return this.cloudService.getDeploymentDetails(deploymentId);
  }

  async terminateDeployment(deploymentId) {
    return this.cloudService.closeDeployment(deploymentId);
  }

  async fetchLeaseDetails(leaseId) {
    return this.cloudService.getLeaseDetails(leaseId);
  }

  async terminateLease(leaseId) {
    return this.cloudService.closeLease(leaseId);
  }

  async fetchUserBalance() {
    return this.cloudService.getUserBalance();
  }

  async saveDepositBalance(amount) {
    return this.cloudService.depositBalance(amount);
  }

  async;
}

// **Exporting the Renamed Class**
module.exports = AwsServiceWrapper;
