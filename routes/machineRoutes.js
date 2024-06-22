const express = require("express");
const machineController = require("../controllers/machineController.js")
const machineRouter = express.Router();

machineRouter.route('/register').post(machineController.register)
machineRouter.route('/available').get(machineController.available);
machineRouter.route('/rent').post(machineController.rent);
machineRouter.route('/getOrderDetails').post(machineController.getOrderDetails);
machineRouter.route('/cancelOrder').post(machineController.cancelOrder);
module.exports = machineRouter