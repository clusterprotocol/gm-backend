const express = require("express");
const userController = require("../controllers/userController.js");
const apiKeyMiddleware = require("../middleware/apiKeyMiddleWare.js");
const userRouter = express.Router();

userRouter.route("/register").post(userController.register);

userRouter.route("/isUser").post(userController.isUser);
userRouter
  .route("/getUsdBalance")
  .post(apiKeyMiddleware, userController.getUsdBalance);
userRouter
  .route("/getUsdAdds")
  .post(apiKeyMiddleware, userController.getUsdAdds);
userRouter
  .route("/getUsdSpends")
  .post(apiKeyMiddleware, userController.getUsdSpends);
userRouter.route("/getOrders").post(apiKeyMiddleware, userController.getOrders);
userRouter
  .route("/userNameStatus")
  .post(userController.userNameStatus);
userRouter
  .route("/getUsername")
  .post(apiKeyMiddleware, userController.getUsername);
module.exports = userRouter;
