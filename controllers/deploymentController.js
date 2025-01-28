const deploymentDAO = require("../dao/deploymentDAO.js");
const shellHelper = require("../helpers/shellHelpers.js");

// Create Deployment
const createDeployment = async (req, res) => {
  try {
    const deploymentData = req.body;

    const yamlConfig = deploymentDAO.generateYamlConfig(deploymentData);

    // Save the YAML file
    shellHelper.saveYaml("gpu.yml", yamlConfig);

    // Run deployment command
    const stdout = shellHelper.execCommand(`sphnctl deployment create gpu.yml`);
    const deploymentId = shellHelper.extractDeploymentId(stdout);

    if (!deploymentId) {
      return res
        .status(500)
        .json({ success: false, error: "Deployment ID not found." });
    }

    // Fetch Deployment Details
    const fetchStdout = shellHelper.execCommand(
      `sphnctl deployment get --lid ${deploymentId}`
    );

    const deployment = await deploymentDAO.saveDeploymentToDB(
      deploymentId,
      deploymentData,
      fetchStdout
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

// Get Orders
const getOrders = async (req, res) => {
  try {
    const { userAddress } = req.body;
    if (!userAddress) {
      return res
        .status(400)
        .json({ success: false, message: "User address is required." });
    }

    const orders = await deploymentDAO.getOrdersByUserAddress(userAddress);
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Orders fetched successfully", orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Deployment Events
const getEvents = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const events = shellHelper.execCommand(
      `sphnctl deployment events --lid ${deploymentId}`
    );
    if (!events.trim()) {
      await deploymentDAO.updateDeploymentStatus(deploymentId, "Offline");
      return res.status(200).json({
        success: true,
        message: "No events found.",
        status: "Offline",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Events fetched successfully.", events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Deployment Logs
const getLogs = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const logs = shellHelper.execCommand(
      `sphnctl deployment logs --lid ${deploymentId}`
    );
    if (!logs.trim()) {
      await deploymentDAO.updateDeploymentStatus(deploymentId, "Offline");
      return res
        .status(200)
        .json({ success: true, message: "No logs found.", status: "Offline" });
    }
    res
      .status(200)
      .json({ success: true, message: "Logs fetched successfully.", logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Deployment
const updateDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const updateData = req.body;

    const updatedDeployment = await deploymentDAO.updateDeployment(
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
    shellHelper.execCommand(`sphnctl deployment close --lid ${deploymentId}`);
    await deploymentDAO.updateDeploymentStatus(deploymentId, "Offline");

    res.status(200).json({
      success: true,
      message: `Deployment ID: ${deploymentId} closed successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDeployment,
  getOrders,
  getEvents,
  getLogs,
  updateDeployment,
  closeDeployment,
};
