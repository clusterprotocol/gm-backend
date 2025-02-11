const express = require("express");
const cloudController = require("../controllers/cloudController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

const cloudRouter = express.Router();

// Protected routes
cloudRouter.use(apiKeyMiddleware);

// Deployment routes
cloudRouter.post("/createDeployment", cloudController.createDeployment);
cloudRouter.put("/updateDeployment", cloudController.updateDeployment);
cloudRouter.delete("/terminateDeployment", cloudController.terminateDeployment);
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
cloudRouter.post("/fetchAvailableImages", cloudController.fetchAvailableImages);

module.exports = cloudRouter;
