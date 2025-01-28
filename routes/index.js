const { Router: expressRouter } = require("express");
const router = expressRouter();

const machineRouter = require("./machineRoutes.js");
const apiKeyRouter = require("./apiKeyRoutes.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");
const deploymentRouter = require("./deploymentRoutes.js");
const userRouter = require("./userRoutes.js");

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
router.use("/deployment", deploymentRouter);

module.exports = router;
