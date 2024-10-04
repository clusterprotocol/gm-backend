const { Router: expressRouter } = require("express");
const router = expressRouter();

const machineRouter = require("./machineRoutes");
const userRouter = require("./userRoutes");
const apiKeyRouter = require("./apiKeyRoutes");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleWare.js");

// Public routes
router.use("/keys", apiKeyRouter);

// Status route (protected by API key middleware)
router.get("/status", apiKeyMiddleware, (req, res) => {
    res.json({ message: "API is working" });
});

// Protected routes
router.use(apiKeyMiddleware);
router.use("/machine", machineRouter);

module.exports = router;
