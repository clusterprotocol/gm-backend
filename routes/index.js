const { Router: expressRouter } = require("express");
const router = expressRouter();

const machineRouter = require("./machineRoutes");
const userRouter = require("./userRoutes");
const apiKeyRouter = require("./apiKeyRoutes");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleWare.js");

// Public routes
router.use("/keys", apiKeyRouter);

// Protected routes
router.use(apiKeyMiddleware);
router.use("/machine", machineRouter);
router.use("/user", userRouter);


module.exports = router;