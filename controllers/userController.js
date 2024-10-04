const {clusterContractInstance} = require('../Contract/contract.js')
const {clusterContract, provider} = clusterContractInstance()
require('dotenv').config();
const ethers = require('ethers')
const jwt = require('jsonwebtoken');

const userRegister = require('../models/userRegister.js')

const isUser = async(req,res) => {

    const userAddress = req.body.userAddress;
    // const userBool = await clusterContract.isRegistered(userAddress);
    const user = await userRegister.findOne({userAddress: userAddress});

    if(user){
        // JWT options (optional)
        const options = {
        // expiresIn: '1h'  // Token will expire in 1 hour
        };
        console.log(user)
        // Generate the JWT using the payload, secret key, and options
        const token = jwt.sign(user.userAddress, process.env.JWTSECRET, options);

        return res.json({
            userBool: user? true: false,
            user,
            token
        })
    }
    return res.json({
        userBool: user? true: false,
        user
    })
}

const userNameStatus = async(req,res) => {

    const username = req.body.userName;
    const user = await userRegister.findOne({name: username});
    return res.json({
        isTaken: user && true
    })
}

const getUsername = async(req,res) => {

    const userAddress = req.body.userAddress;
    const user = await userRegister.findOne({userAddress: userAddress});
    const username = user && user.name;
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

        const isUser = await userRegister.findOne({userAddress: userAddress});

        if(isUser){
            // JWT options (optional)
            const options = {
                // expiresIn: '1h'  // Token will expire in 1 hour
            };

            // Generate the JWT using the payload, secret key, and options
            const token = jwt.sign(isUser.userAddress, process.env.JWTSECRET, options);
            res.json({ success: true, isUser, token, message: "User already present" });
        }

        const _id = (await userRegister.create(
          {
            name: name,
            userAddress: userAddress,
            sshKey: sshKey
          }
        ))._id;
    
        // Check if the everything is provided
        if (!name ||  !userAddress ) {
          return res
            .status(400)
            .json({ error: "Not all the required details are provided." });
        }
        console.log('Data is validated')

        // const gasPrice = await provider.getGasPrice()
        // const gasInGwei = ethers.utils.formatUnits(gasPrice, "gwei")
        // console.log(gasInGwei)
        // // const gasPrice = gasData.gasPrice
        // const gasLimit = await clusterContract.estimateGas.registerUser(
        //   name,
        //   "",
        //   userAddress,
        //   sshKey
        // );

        // console.log(ethers.utils.formatUnits(gasLimit, "gwei"))

        // const register = await clusterContract.registerUser(
        //     name,
        //     "",
        //     userAddress,
        //     sshKey,
        //     {
        //       gasLimit,
        //       gasPrice
        //     }
        //   );
        //   console.log("Tx Sent")
        //   await register.wait();
        //   console.log(register)
          

        const userToUpdate = await userRegister.findById(_id);

        if (userToUpdate) {
          userToUpdate.success = true;
          await userToUpdate.save();
        }
        
        // JWT options (optional)
        const options = {
            // expiresIn: 10000  // Token will expire in 1 hour
        };
        console.log(userToUpdate,process.env.JWTSECRET, options)
        // Generate the JWT using the payload, secret key, and options
        const token = jwt.sign(userToUpdate.userAddress, process.env.JWTSECRET, options);

        res.json({ success: true, userToUpdate, token, message: "Registered user successfully" });
      } catch (e) {
        console.error("Error registering user:", e);
        res.status(500).json({ success: false, message: 'Internal Server Error' });

      }

}

const getUsdBalance = async(req, res) => {
    try{
        // const usdBal = parseInt(await clusterContract.getUserBalnce(req.body.userAddress)) * (10**-6);
        res.json({
            success: true,
            usdBalance: 10
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
        const activeOrders = [];
        const pastOrders = [];
        for(i=0;i<orders.length;i++) {
            const orderStatus = await clusterContract.orders(orders[i]).isPending;
            if(orderStatus) {
                activeOrders.push(parseInt(orders[i]));
            }
            else {
                pastOrders.push(parseInt(orders[i]));
            }
        }

        res.json({
            success: true,
            activeOrders: activeOrders,
            pastOrders: pastOrders
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