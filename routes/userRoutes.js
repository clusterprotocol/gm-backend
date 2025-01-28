// const express = require("express");
// const userController = require("../controllers/userControllerOld.js");
// const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");
// const userRouter = express.Router();

// userRouter.route("/isUser").post(userController.isUser);
// userRouter.route("/register").post(userController.register);

// userRouter
//   .route("/getUsdBalance")
//   .post(apiKeyMiddleware, userController.getUsdBalance);
// userRouter
//   .route("/getUsdAdds")
//   .post(apiKeyMiddleware, userController.getUsdAdds);
// userRouter
//   .route("/getUsdSpends")
//   .post(apiKeyMiddleware, userController.getUsdSpends);
// userRouter.route("/getOrders").post(apiKeyMiddleware, userController.getOrders);
// userRouter.route("/userNameStatus").post(userController.userNameStatus);
// userRouter.route("/getUsername").post(userController.getUsername);
// module.exports = userRouter;

const express = require("express");
const userController = require("../controllers/userController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

const userRouter = express.Router();

// Public routes
userRouter.post("/register", userController.register);

// Protected routes (API key middleware applied)
userRouter.use(apiKeyMiddleware);

userRouter.post("/isUser", userController.isUser);
userRouter.post("/getUsdBalance", userController.getUsdBalance);
userRouter.post("/getUsdAdds", userController.getUsdAdds);
userRouter.post("/getUsdSpends", userController.getUsdSpends);
userRouter.post("/getOrders", userController.getOrders);
userRouter.post("/userNameStatus", userController.userNameStatus);
userRouter.post("/getUsername", userController.getUsername);

module.exports = userRouter;
