const { Router: expressRouter } = require("express");
const router = expressRouter();

const machineRouter = require("./machineRoutes.js");
const apiKeyRouter = require("./apiKeyRoutes.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");
const cloudRouter = require("./cloudRoutes.js");
const userRouter = require("./userRoutes.js");
const gpuBillingRouter = require("./gpuBillingRoutes.js");

// Public routes
router.use("/user", userRouter);

// Apply API key middleware to all subsequent routes
router.use(apiKeyMiddleware);

// Status route (protected by API key middleware)
router.get("/status", (req, res) => {
  res.json({ message: "API is working" });
});

// Protected routes
router.use("/apikey", apiKeyRouter);
router.use("/machine", machineRouter);
router.use("/cloud", cloudRouter);
router.use("/gpuBilling", gpuBillingRouter);

module.exports = router;
