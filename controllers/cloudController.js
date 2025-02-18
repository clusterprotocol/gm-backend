const CloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const CloudService = require("../services/deployment/cloudService.js");
const userDAO = require("../dao/userDAO.js");
const transactionDAO = require("../dao/transactionDAO.js");
const { cloudConfig } = require("../constants/cloudConfig.js");
const GPUBillingService = require("../services/gpuBillingService.js");
const ethers = require("ethers");

class CloudController {
  constructor() {
    this.cloudDAO = new CloudDAO();
    this.userDAO = userDAO;
    this.transactionDAO = transactionDAO;
    this.gpuBillingService = new GPUBillingService();
  }

  async createDeployment(req, res) {
    try {
      // 🛠️ Step 1: Validate Input
      const deploymentData = req.body;
      const tokenAddress = deploymentData?.deductionCost?.tokenAddress;
      if (
        !deploymentData.userAddress ||
        !deploymentData.deductionCost ||
        !tokenAddress
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const userAddress = deploymentData.userAddress;
      const totalDeductionCost = parseFloat(
        deploymentData.deductionCost.totalDeduction
      );

      if (isNaN(totalDeductionCost) || totalDeductionCost <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid deduction cost" });
      }

      // 🛠️ Step 2: Fetch & Validate User
      const user = await this.userDAO.findUserByAddress(userAddress);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // 🛠️ Step 3: Deduct Balance Safely
      let previousBalance = user.wallet?.balance || 0; // Default to 0 if balance is undefined
      if (previousBalance < totalDeductionCost) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient balance" });
      }

      let finalBalance = previousBalance - totalDeductionCost;
      user.wallet.balance = finalBalance;

      // 🛠️ Step 4: Cloud Deployment API Call
      const cloudService = new CloudService(deploymentData.cloudProvider);
      const deploymentResponse = await cloudService.createDeployment(
        deploymentData
      );

      if (!deploymentResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: deploymentResponse.message });
      }

      // 🛠️ Step 5: Save Deployment in Database
      const deployment = await this.cloudDAO.saveDeploymentToDB(
        deploymentResponse.deploymentId,
        deploymentData,
        deploymentResponse.response
      );

      await user.save();

      const substractUserBalance =
        await this.gpuBillingService.subtractUserBalance(
          userAddress,
          tokenAddress,
          totalDeductionCost
        );

      // 🛠️ Step 6: Save Transaction
      await transactionDAO.createTransaction({
        userAddress,
        amount: totalDeductionCost,
        deploymentId: deploymentResponse.deploymentId,
        type: "debit",
        previousBalance,
        finalBalance,
        deductionCost: deploymentData.deductionCost,
        message: "Token deducted on deployment",
        txHash: substractUserBalance.txHash,
      });

      console.log("substracting amount from contract wallet");

      // 🛠️ Step 7: Success Response
      res.status(201).json({
        success: true,
        message: "Deployment created successfully",
        deployment,
      });
    } catch (error) {
      console.error("Error in createDeployment:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async terminateDeployment(req, res) {
    try {
      // 🛠️ Step 1: Validate Inputs
      const { deploymentId, cloudProvider, userAddress, deductionCost } =
        req.body;

      if (
        !deploymentId ||
        !cloudProvider ||
        !userAddress ||
        deductionCost === undefined
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      console.log("Terminating Deployment:", deploymentId, cloudProvider);
      const cloudService = new CloudService(cloudProvider);

      // 🛠️ Step 2: Cloud Termination API Call
      const cloudTerminateResponse = await cloudService.terminateDeployment(
        deploymentId
      );
      console.log("Cloud Termination Response:", cloudTerminateResponse);

      if (!cloudTerminateResponse.success) {
        return res.status(500).json({
          success: false,
          message: `Deployment ID: ${deploymentId} failed to close. Error: ${cloudTerminateResponse.message}`,
        });
      }

      // 🛠️ Step 3: Update Deployment Status
      const deploymentData = await this.cloudDAO.updateDeploymentStatus(
        deploymentId,
        "offline"
      );

      if (!deploymentData) {
        return res
          .status(404)
          .json({ success: false, message: "Deployment not found in DB" });
      }

      // 🛠️ Step 4: Check if Deployment Was Active
      const deploymentStartTime = new Date(deploymentData.createdAt).getTime();
      const currentTime = Date.now();
      const deploymentRunningTime =
        (currentTime - deploymentStartTime) / 3600000; // Convert ms to hours

      const isDeploymentActive =
        deploymentRunningTime < deploymentData.duration;

      console.log("Deployment Running Time (hrs):", deploymentRunningTime);
      console.log("Is Deployment Still Active?:", isDeploymentActive);

      if (isDeploymentActive) {
        console.log("Deployment is still active. Calculating refund...");

        // 🛠️ Step 5: Calculate Remaining Amount
        const durationLeft = deploymentData.duration - deploymentRunningTime;
        console.log(
          " deploymentData.duration - deploymentRunningTime",
          deploymentData.duration,
          deploymentRunningTime,
          durationLeft
        );
        const remainingAmount = durationLeft * deploymentData.bidprice;

        if (remainingAmount < 0) {
          console.log(
            "No refund required as deployment time is fully utilized."
          );
        } else {
          console.log("Remaining Amount to be Credited:", remainingAmount);

          // 🛠️ Step 6: Fetch User & Validate
          const user = await this.userDAO.findUserByAddress(userAddress);
          if (!user) {
            return res
              .status(404)
              .json({ success: false, message: "User not found" });
          }

          let previousBalance = JSON.parse(
            JSON.stringify(user.wallet?.balance)
          );
          let finalBalance = previousBalance + remainingAmount;
          user.wallet.balance = finalBalance;
          await user.save();

          console.log(`User's New Balance: ${finalBalance}`);

          console.log("Deducting initial deployment cost...", deductionCost);
          const tokenAddress = deductionCost.tokenAddress.trim(); // Remove any accidental spaces
          const formattedTokenAddress = ethers.getAddress(tokenAddress);

          // 🛠️ Step 8: Deduct Initial Deployment Cost (If Needed)
          console.log(userAddress, formattedTokenAddress, remainingAmount);
          const addUserBalance = await this.gpuBillingService.addUserBalance(
            userAddress,
            formattedTokenAddress,
            remainingAmount
          );
          console.log("User Balance Deducted:", addUserBalance);

          // 🛠️ Step 7: Create Credit Transaction
          await this.transactionDAO.createTransaction({
            userAddress,
            amount: remainingAmount,
            deploymentId,
            type: "credit",
            previousBalance,
            finalBalance,
            deductionCost: { refund: remainingAmount },
            txHash: addUserBalance.txHash,
          });
        }
      }

      // 🛠️ Step 9: Return Success Response
      return res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} closed successfully.`,
      });
    } catch (error) {
      console.error("Error in terminateDeployment:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async updateDeployment(req, res) {
    try {
      const { deploymentId } = req.params;
      const updateData = req.body;
      const cloudService = new CloudService(updateData.cloudProvider);
      const yamlConfig = this.cloudDAO.generateYamlConfig(updateData);
      shellHelper.saveYaml("gpu.yml", yamlConfig);

      const updatedDeployment = await cloudService.updateDeployment(
        deploymentId,
        updateData
      );
      if (!updatedDeployment) {
        return res
          .status(404)
          .json({ success: false, message: "Deployment not found." });
      }
      res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} updated successfully.`,
        updatedDeployment,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchDeploymentDetails(req, res) {
    try {
      const { deploymentId, cloudProvider } = req.body;
      console.log("fetchDeploymentDetails", deploymentId, cloudProvider);
      const cloudService = new CloudService(cloudProvider);
      const details = await cloudService.fetchDeploymentDetails(deploymentId);
      res.status(200).json({
        success: true,
        message: "Deployment details fetched successfully.",
        details,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchAvailableImages(req, res) {
    try {
      // const { cloudProvider } = req.body;
      // const cloudService = new CloudService(cloudProvider);
      // const details = await cloudService.fetchAvailableImages();
      let gpuImages = [],
        cloudProviders = ["Any"];
      const providers = Object.values(cloudConfig);

      for (let cloudProvider of providers) {
        const cloudService = new CloudService(cloudProvider);
        const imageDetails = await cloudService.fetchAvailableImages();
        if (imageDetails.length) {
          gpuImages = gpuImages.concat(imageDetails);
          cloudProviders.push(cloudProvider);
        }
      }

      res.status(200).json({
        success: true,
        message: "Images details fetched successfully.",
        gpuImages,
        cloudProviders,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchLeaseDetails(req, res) {
    try {
      const { leaseId, cloudProvider } = req.params;
      const cloudService = new CloudService(cloudProvider);
      const leaseDetails = await cloudService.fetchLeaseDetails(leaseId);
      res.status(200).json({
        success: true,
        message: "Lease details retrieved successfully.",
        leaseDetails,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async terminateLease(req, res) {
    try {
      const { deploymentId, cloudProvider } = req.query;
      const cloudService = new CloudService(cloudProvider);
      await cloudService.terminateLease(deploymentId);
      res.status(200).json({
        success: true,
        message: `Lease ID: ${deploymentId} closed successfully.`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchLeaseIds(req, res) {
    try {
      const { walletAddress, cloudProvider } = req.body;
      const cloudService = new CloudService(cloudProvider);
      const leaseIds = await cloudService.fetchLeaseIds(walletAddress);
      res.status(200).json({
        success: true,
        message: "Lease IDs retrieved successfully.",
        leaseIds,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchLeasesByState(req, res) {
    try {
      const { walletAddress, options, cloudProvider } = req.body;
      const cloudService = new CloudService(cloudProvider);
      const leases = await cloudService.fetchLeasesByState(
        walletAddress,
        options
      );
      res.status(200).json({
        success: true,
        message: "Leases retrieved successfully.",
        leases,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchUserBalance(req, res) {
    try {
      const { token, walletAddress, cloudProvider } = req.body;
      console.log("fetch User Balance", {
        token,
        walletAddress,
        cloudProvider,
      });
      const cloudService = new CloudService(cloudProvider);
      const balanceResponse = await cloudService.fetchUserBalance(
        token,
        walletAddress,
        cloudProvider
      );
      console.log("balanceResponse ", balanceResponse);
      if (!balanceResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: "Failed to fetch user balance." });
      }
      res.status(200).json(balanceResponse);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async saveDepositBalance(req, res) {
    try {
      const { token, amount, cloudProvider } = req.body;
      const cloudService = new CloudService(cloudProvider);
      const balanceResponse = await cloudService.saveDepositBalance(
        token,
        amount
      );
      if (!balanceResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: "Failed to save deposite balance." });
      }
      res.status(200).json({
        success: true,
        message: "User balance depositted successfully.",
        balance: balanceResponse.leaseDetails,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async withdrawBalance(req, res) {
    try {
      const { token, amount, cloudProvider } = req.body;
      console.log("withdraw balance ", token, amount);
      const cloudService = new CloudService(cloudProvider);
      const balanceResponse = await cloudService.withdrawBalance(token, amount);
      if (!balanceResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: "Failed to save used balance." });
      }
      res.status(200).json({
        success: true,
        message: "Used balance saved successfully.",
        balance: balanceResponse.leaseDetails,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getOrders(req, res) {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res
        .status(400)
        .json({ success: false, message: "User address is required" });
    }

    try {
      // Query MongoDB to get all deployments related to the user's wallet address
      const orders = await this.cloudDAO.getOrdersByUserAddress(userAddress);

      if (orders.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No orders found for this user" });
      }

      // Construct the response with deployment details
      const orderDetails = orders.map((order) => ({
        deploymentId: order.deploymentId,
        name: order.cpuname,
        location: order.region,
        gpuName: order.gpuname,
        rentalDuration: order.duration,
        machineId: order.gpuname,
        image: order.dockerImage,
        port: order.openedPorts[0],
        amount: order.bidprice,
        status: order.status,
        statusDetails: order.data || {},
        cloudProvider: order.cloudProvider,
        deductionCost: order.deductionCost,
      }));

      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders: orderDetails,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  }

  async getLogs(req, res) {
    try {
      const { deploymentId, cloudProvider } = req.body;
      if (!deploymentId) {
        res.status(500).json({
          success: false,
          message: "Deployment Id is required",
          error: error.message,
        });
      }

      const cloudService = new CloudService(cloudProvider);
      const logs = await cloudService.getLogs(deploymentId);
      return res.status(200).json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error("Error fetching logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
        error: error.message,
      });
    }
  }

  async getEvents(req, res) {
    try {
      const { deploymentId, cloudProvider } = req.body;

      if (!deploymentId) {
        res.status(500).json({
          success: false,
          message: "Deployment Id is required",
          error: error.message,
        });
      }

      const cloudService = new CloudService(cloudProvider);
      const events = await cloudService.getEvents(deploymentId);

      return res.status(200).json({ success: true, events });
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch events",
        error: error.message,
      });
    }
  }
}

module.exports = CloudController;
