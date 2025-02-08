const cloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const cloudService = require("../services/deployment/cloudService.js");

class CloudController {
  static async createDeployment(req, res) {
    try {
      const deploymentData = req.body;
      const yamlConfig = cloudDAO.generateYamlConfig(deploymentData);
      shellHelper.saveYaml("gpu.yml", yamlConfig);
      const deploymentResponse = await cloudService.createDeployment(
        deploymentData
      );

      if (!deploymentResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: "Deployment ID not found." });
      }

      const deploymentId = deploymentResponse.deploymentId;
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

  static async updateDeployment(req, res) {
    try {
      const { deploymentId } = req.params;
      const updateData = req.body;
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

  static async terminateDeployment(req, res) {
    try {
      const { deploymentId } = req.params;
      await cloudService.terminateDeployment(deploymentId);
      res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} closed successfully.`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async fetchDeploymentDetails(req, res) {
    try {
      const { deploymentId } = req.params;
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

  static async fetchLeaseDetails(req, res) {
    try {
      const { leaseId } = req.params;
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

  static async terminateLease(req, res) {
    try {
      const { leaseId } = req.params;
      await cloudService.terminateLease(leaseId);
      res.status(200).json({
        success: true,
        message: `Lease ID: ${leaseId} closed successfully.`,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async fetchLeaseIds(req, res) {
    try {
      const { walletAddress } = req.body;
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

  static async fetchLeasesByState(req, res) {
    try {
      const { walletAddress, options } = req.body;
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

  static async fetchUserBalance(req, res) {
    try {
      const { token, walletAddress, cloudProvider } = req.body;
      const balanceResponse = await cloudService.fetchUserBalance(
        token,
        walletAddress,
        cloudProvider
      );
      if (!balanceResponse.success) {
        return res
          .status(500)
          .json({ success: false, error: "Failed to fetch user balance." });
      }
      res.status(200).json({
        success: true,
        message: "User balance fetched successfully.",
        balance: balanceResponse.leaseDetails,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveDepositBalance(req, res) {
    try {
      const { token, amount, cloudProvider } = req.body;
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

  static async withdrawBalance(req, res) {
    try {
      const { token, amount, cloudProvider } = req.body;
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
