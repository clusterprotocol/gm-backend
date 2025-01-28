const express = require("express");
const deploymentController = require("../controllers/deploymentController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

const deploymentRouter = express.Router();

// Protected routes
deploymentRouter.use(apiKeyMiddleware);

// Deployment routes
deploymentRouter.post("/create", deploymentController.createDeployment);
deploymentRouter.post("/getOrders", deploymentController.getOrders);
deploymentRouter.get("/events/:deploymentId", deploymentController.getEvents);
deploymentRouter.get("/logs/:deploymentId", deploymentController.getLogs);
deploymentRouter.put(
  "/update/:deploymentId",
  deploymentController.updateDeployment
);
deploymentRouter.get(
  "/close/:deploymentId",
  deploymentController.closeDeployment
);

module.exports = deploymentRouter;
