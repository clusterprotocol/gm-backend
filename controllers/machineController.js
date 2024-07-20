const axios = require("axios");
const {clusterContractInstance} = require('../Contract/contract.js')
const {clusterContract, provider} = clusterContractInstance()

const RegisterMachine = require("../models/registerMachine.js");
const Order = require('../models/order.js')

const register = async(req,res) => {

    const machineData = req.body;
    const walletAddress = req.body.walletAddress;
  
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required." });
    }
  
    try {
      const isUserRegistered = await clusterContract.isRegistered(
        walletAddress
      );
  
      if (!isUserRegistered) {
        return res
          .status(400)
          .json({ error: "Not a registered user." });
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
          gasPrice: feeData.gasPrice
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
  
      res.json({
        success: true,
        transactionHash: receipt.transactionHash,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }

}

const available = async(req,res) => {

    try {
        const maxMachineId = parseInt(await clusterContract.machineId());
        let allMachines = [];

  
        if (maxMachineId > 10000) {
          const allContractCall = [];
          let currentMachineId = 10001;
    
          while (maxMachineId >= currentMachineId) {
            allContractCall.push(clusterContract.machines(currentMachineId));
            currentMachineId++;
          }
    
          var responses = await Promise.all(allContractCall);
    
          for (let i = 0; i < responses.length; i++) {


            const machineInfo = responses[i];
            const info = {
            machineId: 10000 + i + 1,
            cpuName: machineInfo.cpuName,
            gpuName: machineInfo.gpuName,
            gpuVRAM: parseInt(machineInfo.gpuVRAM),
            totalRAM: parseInt(machineInfo.totalRAM),
            storageAvailable: parseInt(machineInfo.storageAvailable),
            coreCount: parseInt(machineInfo.coreCount),
            IPAddress: machineInfo.IPAddress,
            portsOpen: machineInfo.portsOpen,
            region: machineInfo.region,
            bidPrice: parseInt(machineInfo.bidPrice),
            isAvailable: machineInfo.isAvailable,
            isListed: machineInfo.isListed,
            };
    
            allMachines.push(info); 

          }
    
          res.json({
            success: true,
            message: allMachines,
          });
        }
      } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }

}

const rent = async(req,res) => {

    try {
        // Extract required information from the request body
        const machineId = req.body.machineId;
        const rentalDuration = req.body.rentalDuration;
        const userAddress = req.body.userAddress;

        
                
        if (!userAddress || !rentalDuration || !machineId) {
          return res.status(400).json({ error: "Not all the required details are provided." });
        }
      
        const gasPrice = await provider.getGasPrice();
        const gasLimit = await clusterContract.estimateGas.rentMachine(
          machineId,
          rentalDuration,
          userAddress
        );
        // Call the rentMachine function in smart contract and get the orderId
        const order = await clusterContract.rentMachine(
          machineId,
          rentalDuration,
          userAddress,
          {
            gasLimit,
            gasPrice,
          }
        );

        await order.wait();

        const orderId = parseInt(await clusterContract.orderId())
        console.log(orderId)
        

        const orderInfo = await clusterContract.orders(orderId)
        const revokeTime = orderInfo.orderTimestamp + rentalDuration * 3600
        const machineDetails = await clusterContract.machines(machineId);
        const ipAddress = machineDetails.IPAddress;
        const linkToSsh = "http://" + ipAddress + ":6666/init_ssh";
        const userDetails = await clusterContract.users(userAddress);
        const userSsh = userDetails.sshPublicKey;
        const username = userDetails.name;
        const dataToSend = {
            "aws_access_key_id": process.env.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": process.env.AWS_SECRET_ACCESS_KEY,
            "aws_region": process.env.AWS_REGION,
            "ecr_repo": process.env.ERC_REPO,
            "order_duration": rentalDuration,
            "order_id": orderId,
            "docker_image": "ubuntu",
            "username": username,
            "public_key": userSsh
        }

        const initSSHResponse = await axios.post(linkToSsh, dataToSend);
        console.log(initSSHResponse);
        const host_port = initSSHResponse.data.containers[0].host_port;

        const sshCommand = "ssh -i yourfile.pem -p"  +host_port + " " + username  + "@" + ipAddress;
        console.log(sshCommand)
        const newOrder = new Order({
            orderId: parseInt(orderId),
            machineId: machineId,
            renterId: userAddress,
            hoursRented: rentalDuration,
            connectionCommand: sshCommand,
            startTime: orderInfo.orderTimestamp,
            revokeTime: revokeTime
        })

        await newOrder.save();

        // Respond with the orderId and the response from the SSH initialization endpoint
        res.json({
          success: true,
          message: "Machine rented successfully",
          orderId: parseInt(orderId),
          host_port: host_port,
          sshCommand: sshCommand
        });
    
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
}

const cancelOrder = async(req,res) => {
    try{
        const orderId = req.body.orderId;
        const cancelOrder = await clusterContract.cancelOrder(orderId);
        await cancelOrder.wait();
        res.json({
            success: true,
            status: "Cancelled successfully"
        })
    } catch(error) {
        res.status(500).json({success: false, message: error.message})
    }
}

const getMachineDetails = async(req, res) => {
    try{
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
            isRented: machineDetails.isRented
        };
        res.json({
            success: true,
            machineDetails: formattedMachineDetails
        })
    }
    catch(error) {
        res.status(500).json({success: false, message: error.message})
    }
}

const getOrderDetails = async(req, res) => {
    try{
        const orderId = req.body.orderId;
        const orderInfo = await clusterContract.orders(orderId);
        const renter =  orderInfo.renter;
        const orderStartTime = parseInt(orderInfo.orderTimestamp);
        const orderEndTime = orderStartTime + orderInfo.rentalDuration * 3600;
        const amountPaid = parseInt(orderInfo.amountToHold) * 10**-6;
        const orderStatus = orderInfo.isPending;
        const machineId = parseInt(orderInfo.machineId);
        const order = await Order.findOne({ orderId: parseInt(orderId) });
        const isPending = orderInfo.isPending;

        if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
        }
        res.json({
            renter: renter,
            orderStartTime: orderStartTime,
            orderEndTime: orderEndTime,
            amountPaid: amountPaid,
            orderStatus: orderStatus,
            machineId: machineId,
            sshCommand: order.connectionCommand,
            isPending: isPending
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


module.exports = {
    register,
    available,
    rent,
    getOrderDetails,
    cancelOrder,
    getMachineDetails
}