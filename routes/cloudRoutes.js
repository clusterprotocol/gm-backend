const express = require("express");
const cloudController = require("../controllers/cloudController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

const cloudRouter = express.Router();

// Protected routes
cloudRouter.use(apiKeyMiddleware);

// Deployment routes
cloudRouter.post("/create", cloudController.createDeployment);
cloudRouter.put("/update/:deploymentId", cloudController.updateDeployment);
cloudRouter.get("/close/:deploymentId", cloudController.closeDeployment);
cloudRouter.post("/getDeploymentDetails", cloudController.getDeploymentDetails);
cloudRouter.post("/getLeaseDetails", cloudController.getLeaseDetails);
cloudRouter.post("/getLeaseIds", cloudController.getLeaseIds);
cloudRouter.post("/closeLease", cloudController.closeLease);
cloudRouter.post("/getLeasesByState", cloudController.getLeasesByState);
cloudRouter.post("/getUserBalance", cloudController.getUserBalance);
cloudRouter.post("/depositBalance", cloudController.depositBalance);
cloudRouter.post("/withdrawBalance", cloudController.withdrawBalance);

module.exports = cloudRouter;
