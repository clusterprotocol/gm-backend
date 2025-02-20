const CloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const CloudService = require("../services/deployment/cloudService.js");
const userDAO = require("../dao/userDAO.js");
const transactionDAO = require("../dao/transactionDAO.js");
const { cloudConfig } = require("../constants/cloudConfig.js");
const GPUBillingService = require("../services/gpuBillingService.js");
const ethers = require("ethers");
const ContainerService = require("../services/containerServices/containerServices.js");
const CommonFunction = require("../Utils/commonFunctions.js");

class CloudController {
  constructor() {
    this.cloudDAO = new CloudDAO();
    this.userDAO = userDAO;
    this.transactionDAO = transactionDAO;
    this.gpuBillingService = new GPUBillingService();
    this.containerService = new ContainerService();
    this.commonFunction = new CommonFunction();
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

      console.log("deployment ", deployment);

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

      // console.log("substracting amount from contract wallet");

      // const deployment = {
      //   deploymentId: "i-0672a5babaebe2f10",
      //   dockerImage: "jenkins/jenkins:lts",
      //   duration: "1",
      //   cloudProvider: "AWS",
      //   cpuname: "XYX_5VUCCGR4X8",
      //   gpuname: "T2",
      //   cpuVRam: 20,
      //   totalRam: 20,
      //   memorySize: "100",
      //   coreCount: 1,
      //   ipAddr: "192.168.0.1",
      //   openedPorts: [8080],
      //   region: "us-east-1",
      //   bidprice: 4.352,
      //   walletAddress: "0x3E0314C782F4885cB15cf36Dd6D6097E0314FE21",
      //   status: "Active",
      //   deductionCost: {
      //     fromWallet: 26.112000000000002,
      //     fromAccount: 0,
      //     totalDeduction: 26.112000000000002,
      //     tokenAddress: "0xb72dBB3fd3ADAbB603029F08E41d0Efae1Ba22DE",
      //   },
      //   createdAt: "2025-02-18T14:27:25.920Z",
      //   __v: 0,
      // };

      //this delay is required to start instance completely.
      await this.commonFunction.waitForSeconds(13);

      const startingDocker = await cloudService.initiateContainerServices(
        deployment
      );

      if (startingDocker?.error) {
        throw new Error(startingDocker.error);
      }

      await this.cloudDAO.addContainerData(deployment.deploymentId, {
        containerData: startingDocker,
      });

      console.log("startingDocker ", startingDocker);

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
        .json({ success: false, message: error.message, error: error.message });
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
        // statusDetails: order.data || {},
        cloudProvider: order.cloudProvider,
        deductionCost: order.deductionCost,
        containerData: order.containerData,
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
      const { cloudProvider, logData } = req.body;
      if (!logData) {
        res.status(500).json({
          success: false,
          message: "Missing required fields.",
          error: error.message,
        });
      }

      // let data = {
      //   deploymentId: "i-0672a5babaebe2f10",
      //   containerId:
      //     "9cefe8b3542e40b240e90f431ce6a7671a7666290a4891fbb51c67e167c6bde9",
      // };

      const cloudService = new CloudService(cloudProvider);
      const logs = await cloudService.getLogs(logData);
      // const logs =
      //   'Running from: /usr/share/jenkins/jenkins.war\r\nwebroot: /var/jenkins_home/war\r\n2025-02-20 06:00:33.501+0000 [id=1]\tINFO\twinstone.Logger#logInternal: Beginning extraction from war file\r\n2025-02-20 06:00:34.279+0000 [id=1]\tWARNING\to.e.j.ee9.nested.ContextHandler#setContextPath: Empty contextPath\r\n2025-02-20 06:00:34.338+0000 [id=1]\tINFO\torg.eclipse.jetty.server.Server#doStart: jetty-12.0.16; built: 2024-12-09T21:02:54.535Z; git: c3f88bafb4e393f23204dc14dc57b042e84debc7; jvm 17.0.14+7\r\n2025-02-20 06:00:34.831+0000 [id=1]\tINFO\to.e.j.e.w.StandardDescriptorProcessor#visitServlet: NO JSP Support for /, did not find org.eclipse.jetty.ee9.jsp.JettyJspServlet\r\n2025-02-20 06:00:34.882+0000 [id=1]\tINFO\to.e.j.s.DefaultSessionIdManager#doStart: Session workerName=node0\r\n2025-02-20 06:00:35.402+0000 [id=1]\tINFO\thudson.WebAppMain#contextInitialized: Jenkins home directory: /var/jenkins_home found at: EnvVars.masterEnvVars.get("JENKINS_HOME")\r\n2025-02-20 06:00:35.541+0000 [id=1]\tINFO\to.e.j.s.handler.ContextHandler#doStart: Started oeje9n.ContextHandler$CoreContextHandler@63411512{Jenkins v2.492.1,/,b=file:///var/jenkins_home/war/,a=AVAILABLE,h=oeje9n.ContextHandler$CoreContextHandler$CoreToNestedHandler@35cd68d4{STARTED}}\r\n2025-02-20 06:00:35.564+0000 [id=1]\tINFO\to.e.j.server.AbstractConnector#doStart: Started ServerConnector@4d192aef{HTTP/1.1, (http/1.1)}{0.0.0.0:8080}\r\n2025-02-20 06:00:35.585+0000 [id=1]\tINFO\torg.eclipse.jetty.server.Server#doStart: Started oejs.Server@5b444398{STARTING}[12.0.16,sto=0] @2689ms\r\n2025-02-20 06:00:35.586+0000 [id=25]\tINFO\twinstone.Logger#logInternal: Winstone Servlet Engine running: controlPort=disabled\r\n2025-02-20 06:00:35.755+0000 [id=24]\tINFO\tjenkins.model.Jenkins#<init>: Starting version 2.492.1\r\n2025-02-20 06:00:35.846+0000 [id=33]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Started initialization\r\n2025-02-20 06:00:35.862+0000 [id=35]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Listed all plugins\r\n2025-02-20 06:00:36.973+0000 [id=37]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Prepared all plugins\r\n2025-02-20 06:00:36.978+0000 [id=36]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Started all plugins\r\n2025-02-20 06:00:36.980+0000 [id=34]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Augmented all extensions\r\n2025-02-20 06:00:37.225+0000 [id=38]\tINFO\tjenkins.InitReactorRunner$1#onAttained: System config loaded\r\n2025-02-20 06:00:37.227+0000 [id=33]\tINFO\tjenkins.InitReactorRunner$1#onAttained: System config adapted\r\n2025-02-20 06:00:37.227+0000 [id=33]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Loaded all jobs\r\n2025-02-20 06:00:37.229+0000 [id=33]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Configuration for all jobs updated\r\n2025-02-20 06:00:37.273+0000 [id=51]\tINFO\thudson.util.Retrier#start: Attempt #1 to do the action check updates server\r\n2025-02-20 06:00:37.720+0000 [id=31]\tINFO\tjenkins.install.SetupWizard#init: \r\n\r\n*************************************************************\r\n*************************************************************\r\n*************************************************************\r\n\r\nJenkins initial setup is required. An admin user has been created and a password generated.\r\nPlease use the following password to proceed to installation:\r\n\r\nfa64353af13048f39c5e7c4b33fcec1e\r\n\r\nThis may also be found at: /var/jenkins_home/secrets/initialAdminPassword\r\n\r\n*************************************************************\r\n*************************************************************\r\n*************************************************************\r\n\r\n2025-02-20 06:00:42.556+0000 [id=31]\tINFO\tjenkins.InitReactorRunner$1#onAttained: Completed initialization\r\n2025-02-20 06:00:42.580+0000 [id=24]\tINFO\thudson.lifecycle.Lifecycle#onReady: Jenkins is fully up and running\r\n2025-02-20 06:00:44.546+0000 [id=51]\tINFO\th.m.DownloadService$Downloadable#load: Obtained the updated data file for hudson.tasks.Maven.MavenInstaller\r\n2025-02-20 06:00:44.547+0000 [id=51]\tINFO\thudson.util.Retrier#start: Performed the action check updates server successfully at the attempt #1\r\n';
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
