const express = require("express");
const userController = require("../controllers/userController.js")
const userRouter = express.Router();

userRouter.route('/isUser').post(userController.isUser);
userRouter.route('/register').post(userController.register);

module.exports = userRouter