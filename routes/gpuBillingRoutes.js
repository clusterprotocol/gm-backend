const express = require("express");
const GPUBillingController = require("../controllers/gpuBillingController");
const env = require("../config/env");

const gpuBillingRouter = express.Router();

const providerUrl = env.RPC_URL;
const contractAddress = env.DEPLOYED_ADDRESS;
const ownerPrivateKey = env.PRIVATE_KEY;

const gpuBillingController = new GPUBillingController(
  providerUrl,
  contractAddress,
  ownerPrivateKey
);

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
gpuBillingRouter.get("/transactions/:userAddress", (req, res) =>
  gpuBillingController.getTransactions(req, res)
);

module.exports = gpuBillingRouter;
