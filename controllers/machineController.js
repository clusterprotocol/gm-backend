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
      
      const gasPrice = await provider.getFeeData()
    //   const estimatedGas = ethers.estimateGas(clusterContract.registerMachines)

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
          gasPrice: gasPrice.maxFeePerGas,
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

        const orderId = await clusterContract.orderId()
        
        

        const orderInfo = await clusterContract.orders(orderId)
        const revokeTime = orderInfo.orderTimestamp + rentalDuration * 3600
        const machineDetails = await clusterContract.machines(machineId);
        const ipAddress = machineDetails.IPAddress;
        const linkToSsh = "http://" + ipAddress + ":6666/init_ssh";
        const username = await clusterContract.users(userAddress).username;
        const userDetails = await clusterContract.users(userAddress);
        const userSsh = userDetails.sshPublicKey;
        const dataToSend = {
            "aws_access_key_id": "AKIAWFZYM2JEAPDRUZ2D",
            "aws_secret_access_key": "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",
            "aws_region": "ap-south-1",
            "ecr_repo": "424783172168.dkr.ecr.ap-south-1.amazonaws.com",
            "order_duration": rentalDuration,
            "order_id": orderId,
            "docker_image": "ubuntu",
            "username": username,
            "public_key": userSsh
        }

        const initSSHResponse = await axios.post(linkToSsh, dataToSend);
        const host_port = initSSHResponse.data[0].host_port;
        const sshCommand = "ssh -i yourfile.pem -p" + host_port +  username + ipAddress;
        console.log(sshCommand)
        // Respond with the orderId and the response from the SSH initialization endpoint
        res.json({
          success: true,
          message: "Machine rented successfully",
          orderId: parseInt(orderId),
          host_port: host_port,
          sshCommand: sshCommand
        });
    
      } catch (error) {
        console.error("Error renting a machine:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }


}

const getOrderDetails = async(req, res) => {
    try{
        const orderId = req.body.orderId;
        const orderInfo = await clusterContract.orders(orderId);
        const renter =  orderInfo.renter;
        const orderEndTime = orderInfo.orderTimestamp + orderInfo.rentalDuration * 3600;
        const amountPaid = parseInt(orderInfo.amountToHold) * 10**-6;
        const orderStatus = orderInfo.isPending;
        const machineId = parseInt(orderInfo.machineId);
        res.json({
            renter: renter,
            orderEndTime: orderEndTime,
            amountPaid: amountPaid,
            orderStatus: orderStatus,
            machineId: machineId
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
    getOrderDetails
}