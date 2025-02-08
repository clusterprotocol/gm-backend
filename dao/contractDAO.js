const { ClusterContract } = require("../Contract/contract.js");
const axios = require("axios");

class ClusterService {
  constructor() {
    this.clusterContract = new ClusterContract().getContract();
  }

  async isUserRegistered(walletAddress) {
    return this.clusterContract.isRegistered(walletAddress);
  }

  async registerMachines(machineData, feeData) {
    return this.clusterContract.registerMachines(
      machineData.cpuname,
      machineData.gpuname,
      machineData.spuVRam,
      machineData.totalRam,
      machineData.memorySize,
      machineData.coreCount,
      machineData.ipAddr,
      machineData.openedPorts,
      machineData.region,
      machineData.bidprice,
      machineData.walletAddress,
      { gasPrice: feeData.gasPrice }
    );
  }

  async getOrderDetails(orderId) {
    return this.clusterContract.orders(orderId);
  }

  async getMachineDetails(machineId) {
    return this.clusterContract.machines(machineId);
  }

  async rentMachine(machineId, rentalDuration, userAddress) {
    return this.clusterContract.rentMachine(
      machineId,
      rentalDuration,
      userAddress
    );
  }

  async cancelOrder(orderId) {
    const tx = await this.clusterContract.cancelOrder(orderId);
    return tx.wait(); // Wait for the transaction receipt
  }

  async getBandwidthFromMachine(ipAddress, containerId) {
    const linkToSsh = `http://${ipAddress}:6666/bandwidth`;
    const response = await axios({
      method: "get",
      url: linkToSsh,
      data: { container_id: containerId },
    });
    return response.data; // { download, upload, ping }
  }
}

module.exports = new ClusterService();
