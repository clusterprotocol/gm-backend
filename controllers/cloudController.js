const cloudDAO = require("../dao/cloudDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");
const cloudService = require("../services/deployment/cloudService.js");

// Create Deployment
const createDeployment = async (req, res) => {
  try {
    const deploymentData = req.body;
    const yamlConfig = cloudDAO.generateYamlConfig(deploymentData);
    shellHelper.saveYaml("gpu.yml", yamlConfig);
    const deploymentResponse = await cloudService.deployApplication(
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
};

// Update Deployment
const updateDeployment = async (req, res) => {
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
};

// Close Deployment
const closeDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    await cloudService.closeDeployment(deploymentId);
    res.status(200).json({
      success: true,
      message: `Deployment ID: ${deploymentId} closed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Deployment Details
const getDeploymentDetails = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const details = await cloudService.getDeploymentDetails(deploymentId);
    res.status(200).json({
      success: true,
      message: "Deployment details fetched successfully.",
      details,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lease Services
const getLeaseDetails = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const leaseDetails = await cloudService.getLeaseDetails(leaseId);
    res.status(200).json({
      success: true,
      message: "Lease details retrieved successfully.",
      leaseDetails,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const closeLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    await cloudService.closeLease(leaseId);
    res.status(200).json({
      success: true,
      message: `Lease ID: ${leaseId} closed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeaseIds = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const leaseIds = await cloudService.getLeaseIds(walletAddress);
    res.status(200).json({
      success: true,
      message: "Lease IDs retrieved successfully.",
      leaseIds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeasesByState = async (req, res) => {
  try {
    const { walletAddress, options } = req.body;
    const leases = await cloudService.getLeasesByState(walletAddress, options);
    res.status(200).json({
      success: true,
      message: "Leases retrieved successfully.",
      leases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User Balance
const getUserBalance = async (req, res) => {
  try {
    const { token, walletAddress, cloudProvider } = req.body;
    const balanceResponse = await cloudService.getUserBalance(
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
};

// Deposit Balance
const depositBalance = async (req, res) => {
  try {
    const { token, amount, cloudProvider } = req.body;
    const depositResponse = await cloudService.depositBalance(
      token,
      amount,
      cloudProvider
    );

    if (!depositResponse.success) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to deposit balance." });
    }

    res.status(200).json({
      success: true,
      message: "Balance deposited successfully.",
      response: depositResponse.response,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Withdraw Balance
const withdrawBalance = async (req, res) => {
  try {
    const { token, amount, cloudProvider } = req.body;
    const withdrawResponse = await cloudService.withdrawBalance(
      token,
      amount,
      cloudProvider
    );

    if (!withdrawResponse.success) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to withdraw balance." });
    }

    res.status(200).json({
      success: true,
      message: "Balance withdrawn successfully.",
      response: withdrawResponse.withdrawReciept,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDeployment,
  updateDeployment,
  closeDeployment,
  getDeploymentDetails,
  getLeaseDetails,
  closeLease,
  getLeaseIds,
  getLeasesByState,
  getUserBalance,
  depositBalance,
  withdrawBalance,
};
