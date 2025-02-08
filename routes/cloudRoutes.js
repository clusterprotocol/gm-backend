const express = require("express");
const cloudController = require("../controllers/cloudController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

const cloudRouter = express.Router();

// Protected routes
cloudRouter.use(apiKeyMiddleware);

// Deployment routes
cloudRouter.post("/createDeployment", cloudController.createDeployment);
cloudRouter.put(
  "/updateDeployment/:deploymentId",
  cloudController.updateDeployment
);
cloudRouter.delete(
  "/terminateDeployment/:deploymentId",
  cloudController.terminateDeployment
);
cloudRouter.post(
  "/fetchDeploymentDetails",
  cloudController.fetchDeploymentDetails
);
cloudRouter.post("/fetchLeaseDetails", cloudController.fetchLeaseDetails);
cloudRouter.post("/fetchLeaseIds", cloudController.fetchLeaseIds);
cloudRouter.delete("/terminateLease", cloudController.terminateLease);
cloudRouter.post("/fetchLeasesByState", cloudController.fetchLeasesByState);
cloudRouter.post("/fetchUserBalance", cloudController.fetchUserBalance);
cloudRouter.post("/saveDepositBalance", cloudController.saveDepositBalance);
cloudRouter.post("/withdrawBalance", cloudController.withdrawBalance);

module.exports = cloudRouter;
