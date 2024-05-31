const axios = require("axios");
const {clusterContractInstance} = require('../Contract/contract.js')
const {clusterContract, provider} = clusterContractInstance()

const RegisterMachine = require("../models/registerMachine.js");

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

module.exports = {
    register,
    available
}