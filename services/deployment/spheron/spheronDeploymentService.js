const spheronClientPromise = require("../../../config/cloudConfigs/spheronConfig.js");
const env = require("../../../config/env.js");
const fileUtils = require("../../../utils/fileUtils.js");

const providerProxyUrl = env.PROVIDER_PROXY_URL;

const deploy = async () => {
  // Wait for the spheronClient to be initialized
  const spheronClient = await spheronClientPromise;

  const fileContent = fileUtils.readGpuYml();

  try {
    const response = await spheronClient.deployment.createDeployment(
      fileContent,
      providerProxyUrl
    );
    return {
      success: true,
      message: "Deployment initiated successfully.",
      deploymentId: response.leaseId,
      url: response.url,
    };
  } catch (error) {
    return {
      success: false,
      message: "Deployment failed.",
      error: error.message,
    };
  }
};

const getDeploymentDetails = async (deploymentId) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const deploymentDetails = await spheronClient.deployment.getDeployment(
      deploymentId,
      providerProxyUrl
    );
    return {
      success: true,
      message: "Deployment details retrieved successfully.",
      deploymentDetails,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch deployment details.",
      error: error.message,
    };
  }
};

const closeDeployment = async (deploymentId) => {
  try {
    const response = await spheronClient.deployment.closeDeployment(
      deploymentId
    );
    return {
      success: true,
      message: "Deployment cancelled successfully.",
      response,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to cancel deployment.",
      error: error.message,
    };
  }
};

const updateDeployment = async (deploymentId) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const fileContent = fileUtils.readGpuYml();

    const updatedDeployment = await spheronClient.deployment.updateDeployment(
      deploymentId,
      fileContent,
      providerProxyUrl
    );
    return {
      success: true,
      message: "Deployment updated successfully.",
      updatedDeployment,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update deployment.",
      error: error.message,
    };
  }
};

module.exports = {
  deploy,
  closeDeployment,
  updateDeployment,
  getDeploymentDetails,
};
