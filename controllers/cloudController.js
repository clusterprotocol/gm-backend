const cloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const CloudService = require("../services/deployment/cloudService.js");

class CloudController {
  async createDeployment(req, res) {
    try {
      const deploymentData = req.body;
      const cloudService = new CloudService(deploymentData.cloudProvider);
      const yamlConfig = cloudDAO.generateYamlConfig(deploymentData);
      shellHelper.saveYaml("gpu.yml", yamlConfig);
      const deploymentResponse = await cloudService.createDeployment(
        deploymentData
      );
      console.log("deploymentResponse", deploymentResponse);
      if (!deploymentResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: deploymentResponse.error });
      }

      const deploymentId = deploymentResponse?.deploymentId;
      const deployment = await cloudDAO.saveDeploymentToDB(
        deploymentId,
        deploymentData
      );

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
      const yamlConfig = cloudDAO.generateYamlConfig(updateData);
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
      const { deploymentId, cloudProvider } = req.params;
      const cloudService = new CloudService(cloudProvider);
      await cloudService.terminateDeployment(deploymentId);
      res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} closed successfully.`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async fetchDeploymentDetails(req, res) {
    try {
      const { deploymentId, cloudProvider } = req.params;
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
      const { cloudProvider } = req.body;
      const cloudService = new CloudService(cloudProvider);
      const details = await cloudService.fetchAvailableImages();
      res.status(200).json({
        success: true,
        message: "Images details fetched successfully.",
        details,
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
      const { leaseId, cloudProvider } = req.params;
      const cloudService = new CloudService(cloudProvider);
      await cloudService.terminateLease(leaseId);
      res.status(200).json({
        success: true,
        message: `Lease ID: ${leaseId} closed successfully.`,
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
        amount,
        cloudProvider
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
      const cloudService = new CloudService(cloudProvider);
      const balanceResponse = await cloudService.withdrawBalance(
        token,
        amount,
        cloudProvider
      );
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
}

module.exports = new CloudController();
