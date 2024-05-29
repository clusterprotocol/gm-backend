const { Router: expressRouter } = require("express");
const router = expressRouter();

// const infoRouter = require("./infoRoutes");
const machineRouter = require("./machineRoutes");
// const userRouter = require("./userRoutes");
// const otherRouter = require('./otherRoutes')

// router.use("/info", infoRouter);
router.use("/machine", machineRouter);
// router.use("/user", userRouter);
// router.use("/other", otherRouter);

module.exports = router;