const express = require("express");
const machineController = require("../controllers/machineController.js")
const machineRouter = express.Router();

machineRouter.route('/register').post(machineController.register)
machineRouter.route('/available').get(machineController.available);

module.exports = machineRouter