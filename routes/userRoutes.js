const express = require("express");
const userController = require("../controllers/userController.js")
const userRouter = express.Router();

userRouter.route('/isUser').post(userController.isUser);
userRouter.route('/register').post(userController.register);
userRouter.route('/getUsdBalance').post(userController.getUsdBalance);
userRouter.route('/getUsdAdds').post(userController.getUsdAdds);
userRouter.route('/getUsdSpends').post(userController.getUsdSpends);
userRouter.route('/getOrders').post(userController.getOrders);
userRouter.route('/userNameStatus').post(userController.userNameStatus);
userRouter.route('/getUsername').post(userController.getUsername);
module.exports = userRouter