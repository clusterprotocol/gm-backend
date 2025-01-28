const { clusterContractInstance } = require("../Contract/contract.js");
const { clusterContract } = clusterContractInstance();

const isUserRegistered = async (walletAddress) => {
  return clusterContract.isRegistered(walletAddress);
};

const registerMachines = async (machineData, feeData) => {
  return clusterContract.registerMachines(
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
};

const getOrderDetails = async (orderId) => {
  return clusterContract.orders(orderId);
};

const getMachineDetails = async (machineId) => {
  return clusterContract.machines(machineId);
};

const rentMachine = async (machineId, rentalDuration, userAddress) => {
  return clusterContract.rentMachine(machineId, rentalDuration, userAddress);
};

const cancelOrder = async (orderId) => {
  const tx = await clusterContract.cancelOrder(orderId);
  return tx.wait(); // Wait for the transaction receipt
};

const getBandwidthFromMachine = async (ipAddress, containerId) => {
  const linkToSsh = `http://${ipAddress}:6666/bandwidth`;

  const response = await axios({
    method: "get",
    url: linkToSsh,
    data: { container_id: containerId },
  });

  return response.data; // { download, upload, ping }
};

module.exports = {
  isUserRegistered,
  registerMachines,
  getOrderDetails,
  getMachineDetails,
  cancelOrder,
  rentMachine,
  getBandwidthFromMachine,
};
