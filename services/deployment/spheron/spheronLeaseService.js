const spheronClientPromise = require("../../../config/cloudConfigs/spheronConfig.js");
const env = require("../../../config/env.js");

const providerProxyUrl = env.PROVIDER_PROXY_URL;

const getLeaseDetails = async (leaseId) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const leaseDetails = await spheronClient.leases.getLeaseDetails(
      leaseId,
      providerProxyUrl
    );
    return {
      success: true,
      message: "Lease details retrieved successfully.",
      leaseDetails,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch lease details.",
      error: error.message,
    };
  }
};

const closeLease = async (leaseId) => {
  try {
    const response = await spheronClient.leases.closeLease(leaseId);
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

const getLeaseIds = async (walletAddress) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const { activeLeaseIds, terminatedLeaseIds, allLeaseIds } =
      await spheronClient.leases.getLeaseIds(walletAddress);
    return {
      success: true,
      message: "Deployment updated successfully.",
      activeLeaseIds,
      terminatedLeaseIds,
      allLeaseIds,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update deployment.",
      error: error.message,
    };
  }
};

const getLeasesByState = async (walletAddress, options) => {
  try {
    // Wait for the spheronClient to be initialized
    const spheronClient = await spheronClientPromise;

    const leases = await spheronClient.leases.getLeaseIds(
      walletAddress,
      options
    );
    return {
      success: true,
      message: "Deployment updated successfully.",
      leases,
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
  getLeaseDetails,
  closeLease,
  getLeaseIds,
  getLeasesByState,
};
