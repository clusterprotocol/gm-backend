const {clusterContractInstance} = require('../Contract/contract.js')
const {clusterContract, provider} = clusterContractInstance()
require('dotenv').config();
const ethers = require('ethers')

const userRegister = require('../models/userRegister.js')

const isUser = async(req,res) => {

    const walletAddress = req.body.walletAddress;
    const userBool = await clusterContract.isRegistered(walletAddress);

    return res.json({
        userBool: userBool,
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

module.exports = {
    isUser,
    register
}