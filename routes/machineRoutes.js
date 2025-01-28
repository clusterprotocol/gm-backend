// const express = require("express");
// const machineController = require("../controllers/machineController.js")
// const machineRouter = express.Router();

// machineRouter.route('/register').post(machineController.register)
// machineRouter.route('/available').get(machineController.available);
// machineRouter.route('/rent').post(machineController.rent);
// machineRouter.route('/getOrderDetails').post(machineController.getOrderDetails);
// machineRouter.route('/cancelOrder').post(machineController.cancelOrder);
// machineRouter.route('/getMachineDetails').post(machineController.getMachineDetails);
// machineRouter.route('/getBandwidth').post(machineController.getBandwidth);

// module.exports = machineRouter

const express = require("express");
const machineController = require("../controllers/machineController.js");
const machineRouter = express.Router();

machineRouter.route("/register").post(machineController.register);
machineRouter.route("/available").get(machineController.available);
machineRouter.route("/rent").post(machineController.rent);
machineRouter.route("/getOrderDetails").post(machineController.getOrderDetails);
machineRouter.route("/cancelOrder").post(machineController.cancelOrder);
machineRouter
  .route("/getMachineDetails")
  .post(machineController.getMachineDetails);
machineRouter.route("/getBandwidth").post(machineController.getBandwidth);

module.exports = machineRouter;
