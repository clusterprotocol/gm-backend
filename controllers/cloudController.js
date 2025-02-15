const CloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const CloudService = require("../services/deployment/cloudService.js");
const userDAO = require("../dao/userDAO.js");
const transactionDAO = require("../dao/transactionDAO.js");
const { cloudConfig } = require("../constants/cloudConfig.js");

class CloudController {
  constructor() {
    this.cloudDAO = new CloudDAO();
    this.userDAO = userDAO;
    this.transactionDAO = transactionDAO;
  }

  async createDeployment(req, res) {
    try {
      const deploymentData = req.body;
      const userAddress = deploymentData.userAddress;
      const cloudService = new CloudService(deploymentData.cloudProvider);
      const deploymentResponse = await cloudService.createDeployment(
        deploymentData
      );
      // const deploymentResponse = {
      //   success: true,
      //   response: {
      //     leaseId: 2954n,
      //     transaction: {
      //       to: "0x1fdf629E5A90eE4FAab1336a23c41A0Cab8CbA9d",
      //       from: "0x6Cd6cC3e99269A7673dFF872c5267A8b0EA3Ac7C",
      //       contractAddress: null,
      //       hash: "0x1dd4e00f455605e72485acee3ce03effb1778988428e3ebaf9666f7cc6fbf77e",
      //       index: 47,
      //       blockHash:
      //         "0x43e0233aee2c1a9baef3c10870b32b2028de9047f82171b43246ec12fc5589cb",
      //       blockNumber: 21873619,
      //       logsBloom:
      //         "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000002",
      //       gasUsed: 464968n,
      //       blobGasUsed: null,
      //       cumulativeGasUsed: 8541123n,
      //       gasPrice: 1000430n,
      //       blobGasPrice: null,
      //       type: 2,
      //       status: 1,
      //       root: undefined,
      //     },
      //   },
      // };
      console.log("deploymentResponse", deploymentResponse);
      if (!deploymentResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: deploymentResponse.message });
      }

      const deployment = await this.cloudDAO.saveDeploymentToDB(
        deploymentResponse.deploymentId,
        deploymentData,
        deploymentResponse.response
      );

      const user = await this.userDAO.findUserByAddress(userAddress);
      let previousBalance = JSON.parse(JSON.stringify(user.wallet.balance));
      console.log(
        "previousBalance",
        user.wallet.balance,
        deploymentData.amount
      );
      let finalBalance = user.wallet.balance - deploymentData.amount; // Subtract money
      user.wallet.balance = finalBalance;
      console.log("finalBalance", user.wallet.balance);
      await user.save();

      await transactionDAO.createTransaction({
        userAddress,
        amount: deploymentData.amount,
        deploymentId: deploymentResponse.deploymentId,
        type: "debit",
        previousBalance,
        finalBalance,
      });

      res.status(201).json({
        success: true,
        message: "Deployment created successfully",
        deployment,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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

  async terminateDeployment(req, res) {
    try {
      const { deploymentId, cloudProvider, userAddress } = req.body;
      console.log("teminatedeployment ", deploymentId, cloudProvider);
      const cloudService = new CloudService(cloudProvider);
      const cloudTerminateResponse = await cloudService.terminateDeployment(
        deploymentId
      );
      console.log("cloudTerminateResponse ", cloudTerminateResponse);
      if (cloudTerminateResponse.success) {
        const deploymentData = await this.cloudDAO.updateDeploymentStatus(
          deploymentId,
          "offline"
        );
        // checking for deplyment is active or not
        const deploymentRunningTime =
          Date.now() / 3600000 -
          new Date(deploymentData.createdAt).getTime() / 3600000;

        const isDeploymentActive =
          deploymentRunningTime < deploymentData.duration; //converting hour into milisec for comaprision

        console.log(isDeploymentActive);

        if (isDeploymentActive) {
          console.log("Deployment is still active.");

          //caculating remaining amount
          const remainingAmount =
            (deploymentData.duration - deploymentRunningTime) *
            deploymentData.bidprice;

          console.log("remainingAmount ", remainingAmount);

          // console.log(
          //   "remainingAmount",
          //   deploymentData.duration,
          //   deploymentRunningTime,
          //   deploymentData.duration - deploymentRunningTime,
          //   remainingAmount
          // );

          // adding amount to user wallet
          const user = await this.userDAO.findUserByAddress(userAddress);
          let previousBalance = JSON.parse(JSON.stringify(user.wallet.balance));
          console.log("previousBalance", user.wallet.balance);
          let finalBalance = user.wallet.balance + remainingAmount;
          user.wallet.balance = finalBalance;
          console.log("finalBalance", user.wallet.balance);
          await user.save();

          // creating a credit transaction
          await this.transactionDAO.createTransaction({
            userAddress,
            amount: remainingAmount,
            deploymentId,
            type: "credit",
            previousBalance,
            finalBalance,
          });
        }

        return res.status(200).json({
          success: true,
          message: `Deployment ID: ${deploymentId} closed successfully.`,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Deployment ID: ${deploymentId} failed to close.`,
        });
      }
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
