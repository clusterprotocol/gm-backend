const {clusterContractInstance} = require('../Contract/contract.js')
const {clusterContract, provider} = clusterContractInstance()
require('dotenv').config();
const ethers = require('ethers')

const userRegister = require('../models/userRegister.js')

const isUser = async(req,res) => {

    const userAddress = req.body.userAddress;
    const userBool = await clusterContract.isRegistered(userAddress);
    return res.json({
        userBool: userBool,
    })
}

const userNameStatus = async(req,res) => {

    const username = req.body.userName;
    const usernameBool = await clusterContract.userNameStatus(username);
    return res.json({
        isTaken: usernameBool
    })
}

const getUsername = async(req,res) => {

    const userAddress = req.body.userAddress;
    const user = await clusterContract.users(userAddress);
    const username = user.name;
    return res.json({
        username: username,
    })
}

const register = async(req,res) => {

    try {
        // Extract info from the request body
        const name = req.body.name;
        const userAddress = req.body.userAddress;
        const sshKey = req.body.sshKey;

        const _id = (await userRegister.create(
          {
            name: name,
            userAddress: userAddress,
            sshKey: sshKey
          }
        ))._id;
    
        // Check if the everything is provided
        if (!name ||  !userAddress || !sshKey) {
          return res
            .status(400)
            .json({ error: "Not all the required details are provided." });
        }
        console.log('Data is validated')

        const gasPrice = await provider.getGasPrice()
        const gasInGwei = ethers.utils.formatUnits(gasPrice, "gwei")
        console.log(gasInGwei)
        // const gasPrice = gasData.gasPrice
        const gasLimit = await clusterContract.estimateGas.registerUser(
          name,
          "",
          userAddress,
          sshKey
        );

        console.log(ethers.utils.formatUnits(gasLimit, "gwei"))

        const register = await clusterContract.registerUser(
            name,
            "",
            userAddress,
            sshKey,
            {
              gasLimit,
              gasPrice
            }
          );
          console.log("Tx Sent")
          await register.wait();
          console.log(register)
          

        const userToUpdate = await userRegister.findById(_id);

        if (userToUpdate) {
          userToUpdate.success = true;
          await userToUpdate.save();
        }
        
        res.json({ success: true, message: "Registered user successfully" });
      } catch (e) {
        console.error("Error registering user:", e);
        res.status(500).json({ success: false, message: 'Internal Server Error' });

      }

}

const getUsdBalance = async(req, res) => {
    try{
        const usdBal = parseInt(await clusterContract.getUserBalnce(req.body.userAddress)) * (10**-6);
        res.json({
            success: true,
            usdBalance: usdBal
        })

    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

const getUsdAdds = async(req, res) => {
    try{
        const usdAdds = await clusterContract.getUsdAdds(req.body.userAddress);
        const parsedUsd = []
        for(i=0;i<usdAdds.length;i++) {
            parsedUsd[i] = parseInt(usdAdds[i])* 10**-6;
        }

        res.json({
            success: true,
            usdAdds: parsedUsd
        })

    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

const getUsdSpends = async(req, res) => {
    try{
        const usdSpends = await clusterContract.getUsdSpends(req.body.userAddress);
        const parsedUsd = []
        for(i=0;i<usdSpends.length;i++) {
            parsedUsd[i] = parseInt(usdSpends[i])* 10**-6;
        }

        res.json({
            success: true,
            usdSpends: parsedUsd
        })

    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

const getOrders = async(req, res) => {
    try{
        const orders = await clusterContract.getOrders(req.body.userAddress);
        const parsedOrders = []
        for(i=0;i<orders.length;i++) {
            parsedOrders[i] = parseInt(orders[i]);
        }

        res.json({
            success: true,
            userOrders: parsedOrders
        })

    }
    catch (e) {
        res.status(500).json({
            success: false,
            message: e.message
        })
    }
}

module.exports = {
    isUser,
    register,
    getUsdBalance,
    getUsdAdds,
    getUsdSpends,
    getOrders,
    userNameStatus,
    getUsername 
}