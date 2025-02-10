const axios = require("axios");
const { clusterContractInstance } = require("../Contract/contract.js");
const { clusterContract, provider } = clusterContractInstance();
const spheronABI = require("../Contract/ProviderRegistry.json");
const RegisterMachine = require("../models/registerMachine.js");
const Order = require("../models/order.js");
const { Web3 } = require("web3");
const { ethers, JsonRpcProvider } = require("ethers");

const web3 = new Web3("https://spheron-devnet-eth.rpc.caldera.xyz/http"); // Correct instantiation

// Contract ABI and address
const contractABI = [
  // Add your contract's ABI here
];
const contractAddress = "0x840399F9b4CBe04a80facD844c6358d8c2d981fB";

// Create a contract instance
// const spheronContract = new web3.eth.Contract(spheronABI, contractAddress);

const register = async (req, res) => {
  const machineData = req.body;
  const walletAddress = req.body.walletAddress;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required." });
  }

  try {
    const isUserRegistered = await clusterContract.isRegistered(walletAddress);

    if (!isUserRegistered) {
      return res.status(400).json({ error: "Not a registered user." });
    }

    const feeData = await provider.getFeeData();
    // const maxFeePerGas = feeData.maxFeePerGas;
    // const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    // const gasLimit = await clusterContract.estimateGas.registerMachines(
    //   machineData.cpuname,
    //   machineData.gpuname,
    //   machineData.spuVRam,
    //   machineData.totalRam,
    //   machineData.memorySize,
    //   machineData.coreCount,
    //   machineData.ipAddr,
    //   machineData.openedPorts,
    //   machineData.region,
    //   machineData.bidprice,
    //   machineData.walletAddress
    // )

    const tx = await clusterContract.registerMachines(
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
      {
        gasPrice: feeData.gasPrice,
      }
    );

    const receipt = await tx.wait();

    console.log(receipt.transactionHash);

    const info = {
      cpuname: machineData.cpuname,
      gpuname: machineData.gpuname,
      spuVRam: machineData.spuVRam,
      totalRam: machineData.totalRam,
      memorySize: machineData.memorySize,
      coreCount: machineData.coreCount,
      ipAddr: machineData.ipAddr,
      openedPorts: machineData.openedPorts,
      region: machineData.region,
      bidprice: machineData.bidprice,
      walletAddress: machineData.walletAddress,
    };

    const newRegisterMachine = new RegisterMachine(info);

    newRegisterMachine
      .save()
      .then(() => {
        console.log("New Machine Added!");
      })
      .catch((error) => {
        console.error("Error adding new Machine", error);
      });

    return res.json({
      success: true,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const available = async (req, res) => {
  try {
    // Fetch data from the API
    const response = await axios.get(
      "https://provider.spheron.network/api/gpu-prices"
    );
    const gpuPrices = response.data;
    // Process and send back the data
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

    return res.json(processedData);
  } catch (error) {
    console.error("Error fetching GPU prices:", error);
    return res.status(500).send("Error fetching GPU prices");
  }
};

const rent = async (req, res) => {
  try {
    // Extract required information from the request body
    const machineId = req.body.machineId;
    const rentalDuration = req.body.rentalDuration;
    const userAddress = req.body.userAddress;

    if (!userAddress || !rentalDuration || !machineId) {
      return res
        .status(400)
        .json({ error: "Not all the required details are provided." });
    }

    // const gasPrice = await provider.getGasPrice();
    // const gasLimit = await clusterContract.estimateGas.rentMachine(
    //   machineId,
    //   rentalDuration,
    //   userAddress
    // );
    // Call the rentMachine function in smart contract and get the orderId
    // const order = await clusterContract.rentMachine(
    //   machineId,
    //   rentalDuration,
    //   userAddress,
    //   {
    //     gasLimit,
    //     gasPrice,
    //   }
    // );

    // await order.wait();

    // const orderId = parseInt(await clusterContract.orderId())
    // console.log(orderId)

    const orderInfo = await clusterContract.orders(orderId);
    const revokeTime = orderInfo.orderTimestamp + rentalDuration * 3600;
    const machineDetails = await clusterContract.machines(machineId);
    const ipAddress = machineDetails.IPAddress;
    const linkToSsh = "http://" + ipAddress + ":6666/init_ssh";
    const userDetails = await clusterContract.users(userAddress);
    const userSsh = userDetails.sshPublicKey;
    const username = userDetails.name;
    const dataToSend = {
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
      aws_region: process.env.AWS_REGION,
      ecr_repo: process.env.ECR_REPO,
      order_duration: rentalDuration,
      order_id: orderId,
      docker_image: "ubuntu",
      username: username,
      public_key: userSsh,
    };

    const initSSHResponse = await axios.post(linkToSsh, dataToSend);
    console.log(initSSHResponse);
    const host_port = initSSHResponse.data.containers[0].host_port;
    const container_Id = initSSHResponse.data.containers[0].container_id;
    console.log(host_port);
    console.log(container_Id);

    const sshCommand =
      "ssh -i yourfile.pem -p" + host_port + " " + username + "@" + ipAddress;
    console.log(sshCommand);
    const newOrder = new Order({
      orderId: parseInt(orderId),
      machineId: machineId,
      renterId: userAddress,
      hoursRented: rentalDuration,
      connectionCommand: sshCommand,
      container_Id: container_Id,
      startTime: orderInfo.orderTimestamp,
      revokeTime: revokeTime,
    });

    await newOrder.save();

    // Respond with the orderId and the response from the SSH initialization endpoint
    return res.json({
      success: true,
      message: "Machine rented successfully",
      orderId: parseInt(orderId),
      host_port: host_port,
      sshCommand: sshCommand,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBandwidth = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const order = await Order.findOne({ orderId: orderId });
    const container_id = order.container_Id;

    const machineId = order.machineId;
    const machineDetails = await clusterContract.machines(machineId);
    const ipAddress = machineDetails.IPAddress;
    const linkToSsh = `http://${ipAddress}:6666/bandwidth`;

    // Make the GET request with query parameters
    const response = await axios({
      method: "get",
      url: linkToSsh,
      data: { container_id },
    });

    const bandwidth = response.data;
    return res.json({
      download: bandwidth.download,
      upload: bandwidth.upload,
      ping: bandwidth.ping,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const cancelOrder = await clusterContract.cancelOrder(orderId);
    await cancelOrder.wait();
    return res.json({
      success: true,
      status: "Cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMachineDetails = async (req, res) => {
  try {
    const machineId = req.body.machineId;
    const machineDetails = await clusterContract.machines(machineId);
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
    return res.json({
      success: true,
      machineDetails: formattedMachineDetails,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const orderInfo = await clusterContract.orders(orderId);
    const renter = orderInfo.renter;
    const orderStartTime = parseInt(orderInfo.orderTimestamp);
    const orderEndTime = orderStartTime + orderInfo.rentalDuration * 3600;
    const amountPaid = parseInt(orderInfo.amountToHold) * 10 ** -6;
    const orderStatus = orderInfo.isPending;
    const machineId = parseInt(orderInfo.machineId);
    const order = await Order.findOne({ orderId: parseInt(orderId) });
    const isPending = orderInfo.isPending;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    return res.json({
      renter: renter,
      orderStartTime: orderStartTime,
      orderEndTime: orderEndTime,
      amountPaid: amountPaid,
      orderStatus: orderStatus,
      machineId: machineId,
      sshCommand: order.connectionCommand,
      isPending: isPending,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  register,
  available,
  rent,
  getOrderDetails,
  cancelOrder,
  getMachineDetails,
  getBandwidth,
};
