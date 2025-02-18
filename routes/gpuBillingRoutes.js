const express = require("express");
const GPUBillingController = require("../controllers/gpuBillingController");
const env = require("../config/env");

const gpuBillingRouter = express.Router();

const gpuBillingController = new GPUBillingController();

gpuBillingRouter.post("/addAllowedToken", (req, res) =>
  gpuBillingController.addAllowedToken(req, res)
);
gpuBillingRouter.post("/removeAllowedToken", (req, res) =>
  gpuBillingController.removeAllowedToken(req, res)
);
gpuBillingRouter.post("/deposit", (req, res) =>
  gpuBillingController.deposit(req, res)
);
gpuBillingRouter.post("/withdraw", (req, res) =>
  gpuBillingController.withdraw(req, res)
);

gpuBillingRouter.post("/ownerWithdraw", (req, res) =>
  gpuBillingController.ownerWithdraw(req, res)
);

gpuBillingRouter.get("/transactions/:userAddress", (req, res) =>
  gpuBillingController.getTransactions(req, res)
);

gpuBillingRouter.get("/getAllTokens", (req, res) =>
  gpuBillingController.getAllTokens(req, res)
);

gpuBillingRouter.get("/getUserBalance/:user", (req, res) =>
  gpuBillingController.getUserBalance(req, res)
);

gpuBillingRouter.post("/getOwnerBalance", (req, res) =>
  gpuBillingController.getOwnerBalance(req, res)
);

gpuBillingRouter.post("/addTokenIntoWallet", (req, res) =>
  gpuBillingController.addTokenIntoWallet(req, res)
);

module.exports = gpuBillingRouter;
