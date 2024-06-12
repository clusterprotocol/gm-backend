const express = require("express");
const userController = require("../controllers/userController.js")
const userRouter = express.Router();

userRouter.route('/isUser').get(userController.isUser);
userRouter.route('/register').post(userController.register);
userRouter.route('/getUsdBalance').get(userController.getUsdBalance);
userRouter.route('/getUsdAdds').get(userController.getUsdAdds);
userRouter.route('/getUsdSpends').get(userController.getUsdSpends);
userRouter.route('/getOrders').get(userController.getOrders);

module.exports = userRouter