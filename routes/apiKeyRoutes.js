const express = require("express");
const apiRouter = express.Router();
const apiKeyController = require("../controllers/ApiKeyController.js");
const apiKeyMiddleware = require("../middleware/auth/apiKeyMiddleWare.js");

// Apply API key middleware to all subsequent routes
apiRouter.use(apiKeyMiddleware);

// Routes
apiRouter.post("/generate", apiKeyController.generateApiKey);
apiRouter.post("/revoke", apiKeyController.revokeApiKey);

module.exports = apiRouter;
