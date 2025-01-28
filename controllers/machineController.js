const {
  saveNewMachine,
  saveNewOrder,
  findOrderByOrderId,
} = require("../dao/machineDAO.js");
const {
  isUserRegistered,
  registerMachines,
  getOrderDetails,
  getMachineDetails,
  cancelOrder,
  rentMachine,
  getBandwidthFromMachine,
} = require("../dao/contractDAO.js");
const { clusterContractInstance } = require("../Contract/contract.js");
const { provider } = clusterContractInstance();
const axios = require("axios");

const register = async (req, res) => {
  const machineData = req.body;
  const walletAddress = req.body.walletAddress;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required." });
  }

  try {
    const isRegistered = await isUserRegistered(walletAddress);
    if (isRegistered) {
      return res.status(400).json({ error: "User is already registered." });
    }

    const feeData = await provider.getFeeData();
    const tx = await registerMachines(machineData, feeData);
    console.log(tx);
    const receipt = await tx.wait();

    console.log(receipt);

    await saveNewMachine(machineData);

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const available = async (req, res) => {
  try {
    const response = await axios.get(
      "https://provider.spheron.network/api/gpu-prices"
    );
    const gpuPrices = response.data;

    const processedData = gpuPrices.map((gpu, key) => ({
      machineId: key,
      availableNum: gpu.availableNum,
      cpuName: gpu.name,
      vendor: gpu.vendor,
      gpuName: gpu.name,
      gpuVRAM: 1,
      totalRAM: 1,
      storageAvailable: 1,
      coreCount: 10,
      IPAddress: 1,
      portsOpen: [8080],
      region: "us-east",
      bidPrice: gpu.averagePrice,
      isAvailable: 1,
      isListed: 1,
    }));

    res.json(processedData);
  } catch (error) {
    res.status(500).send("Error fetching GPU prices");
  }
};

const getOrderDetailsController = async (req, res) => {
  try {
    const { orderId } = req.body;
    const orderInfo = await getOrderDetails(orderId);

    const order = await findOrderByOrderId(parseInt(orderId));
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({
      renter: orderInfo.renter,
      orderStartTime: parseInt(orderInfo.orderTimestamp),
      orderEndTime:
        parseInt(orderInfo.orderTimestamp) + orderInfo.rentalDuration * 3600,
      amountPaid: parseInt(orderInfo.amountToHold) * 10 ** -6,
      orderStatus: orderInfo.isPending,
      machineId: parseInt(orderInfo.machineId),
      sshCommand: order.connectionCommand,
      isPending: orderInfo.isPending,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMachineDetailsController = async (req, res) => {
  try {
    const { machineId } = req.body;
    const machineDetails = await getMachineDetails(machineId);

    const formattedMachineDetails = {
      cpuName: machineDetails.cpuName,
      gpuName: machineDetails.gpuName,
      gpuVRAM: parseInt(machineDetails.gpuVRAM),
      totalRAM: parseInt(machineDetails.totalRAM),
      storageAvailable: parseInt(machineDetails.storageAvailable),
      coreCount: parseInt(machineDetails.coreCount),
      IPAddress: machineDetails.IPAddress,
      region: machineDetails.region,
      bidPrice: parseInt(machineDetails.bidPrice),
      isListed: machineDetails.isListed,
      isRented: machineDetails.isRented,
    };

    res.json({ success: true, machineDetails: formattedMachineDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rent = async (req, res) => {
  try {
    const { machineId, rentalDuration, userAddress } = req.body;

    if (!userAddress || !rentalDuration || !machineId) {
      return res.status(400).json({ error: "Required details are missing." });
    }

    const tx = await rentMachine(machineId, rentalDuration, userAddress);
    const receipt = await tx.wait();
    const orderId = parseInt(await clusterContract.orderId());

    const orderInfo = await clusterContract.orders(orderId);
    const revokeTime = orderInfo.orderTimestamp + rentalDuration * 3600;
    const machineDetails = await getMachineDetails(machineId);
    const ipAddress = machineDetails.IPAddress;

    const linkToSsh = `http://${ipAddress}:6666/init_ssh`;
    const userDetails = await clusterContract.users(userAddress);
    const dataToSend = {
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
      aws_region: process.env.AWS_REGION,
      ecr_repo: process.env.ECR_REPO,
      order_duration: rentalDuration,
      order_id: orderId,
      docker_image: "ubuntu",
      username: userDetails.name,
      public_key: userDetails.sshPublicKey,
    };

    const initSSHResponse = await axios.post(linkToSsh, dataToSend);
    const host_port = initSSHResponse.data.containers[0].host_port;
    const container_Id = initSSHResponse.data.containers[0].container_id;

    const sshCommand = `ssh -i yourfile.pem -p ${host_port} ${userDetails.name}@${ipAddress}`;

    const orderData = {
      orderId,
      machineId,
      renterId: userAddress,
      hoursRented: rentalDuration,
      connectionCommand: sshCommand,
      container_Id,
      startTime: orderInfo.orderTimestamp,
      revokeTime,
    };

    await saveNewOrder(orderData);

    res.json({
      success: true,
      message: "Machine rented successfully",
      orderId,
      host_port,
      sshCommand,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrderController = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const receipt = await cancelOrder(orderId);

    res.json({
      success: true,
      status: "Cancelled successfully",
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBandwidth = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const order = await findOrderByOrderId(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const machineDetails = await getMachineDetails(order.machineId);
    const ipAddress = machineDetails.IPAddress;

    const bandwidth = await getBandwidthFromMachine(
      ipAddress,
      order.container_Id
    );

    res.json({
      download: bandwidth.download,
      upload: bandwidth.upload,
      ping: bandwidth.ping,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  available,
  getOrderDetails: getOrderDetailsController,
  getMachineDetails: getMachineDetailsController,
  rent,
  cancelOrder: cancelOrderController,
  getBandwidth,
};
