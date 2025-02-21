const express = require("express");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");
const CloudController = require("../controllers/cloudController.js");

const cloudRouter = express.Router();
const cloudController = new CloudController();

// Protected routes
cloudRouter.use(apiKeyMiddleware);

// Deployment routes
cloudRouter.post("/createDeployment", (req, res) =>
  cloudController.createDeployment(req, res)
);
cloudRouter.put("/updateDeployment", (req, res) =>
  cloudController.updateDeployment(req, res)
);
cloudRouter.post("/terminateDeployment", (req, res) =>
  cloudController.terminateDeployment(req, res)
);
cloudRouter.post("/fetchDeploymentDetails", (req, res) =>
  cloudController.fetchDeploymentDetails(req, res)
);
cloudRouter.post("/fetchLeaseDetails", (req, res) =>
  cloudController.fetchLeaseDetails(req, res)
);
cloudRouter.post("/fetchLeaseIds", (req, res) =>
  cloudController.fetchLeaseIds(req, res)
);
cloudRouter.delete("/terminateLease", (req, res) =>
  cloudController.terminateLease(req, res)
);
cloudRouter.post("/fetchLeasesByState", (req, res) =>
  cloudController.fetchLeasesByState(req, res)
);
cloudRouter.post("/fetchUserBalance", (req, res) =>
  cloudController.fetchUserBalance(req, res)
);
cloudRouter.post("/saveDepositBalance", (req, res) =>
  cloudController.saveDepositBalance(req, res)
);
cloudRouter.post("/withdrawBalance", (req, res) =>
  cloudController.withdrawBalance(req, res)
);
cloudRouter.get("/fetchAvailableImages", (req, res) =>
  cloudController.fetchAvailableImages(req, res)
);
cloudRouter.post("/getOrders", (req, res) =>
  cloudController.getOrders(req, res)
);
cloudRouter.post("/getLogs", (req, res) => cloudController.getLogs(req, res));
cloudRouter.post("/getEvents", (req, res) =>
  cloudController.getEvents(req, res)
);

cloudRouter.post("/fetchConnectionData", (req, res) =>
  cloudController.fetchConnectionData(req, res)
);

module.exports = cloudRouter;
