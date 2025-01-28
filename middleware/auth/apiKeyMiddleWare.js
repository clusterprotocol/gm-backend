// middleware/apiKeyMiddleware.js
const ApiKey = require("../../models/apiKey");
const jwt = require("jsonwebtoken");

const apiKeyMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Token is missing" });
  }

  try {
    // const keyRecord = await ApiKey.findOne({ key: apiKey });

    // if (!keyRecord) {
    //     return res.status(401).json({ message: 'Invalid API key' });
    // }

    // req.userAddress = keyRecord.userAddress; // Attach the user address to the request object
    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
      if (err) {
        // Token verification failed
        console.error("JWT verification failed:", err.message);
        return res.status(401).json({ message: "Invalid token" });
      } else {
        // Token is valid, and we have the decoded payload
        console.log("Decoded JWT payload:", decoded);
        req.body.userAddress = decoded.userAddress;
        next();
      }
    });
  } catch (error) {
    console.error("Error in API key middleware:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = apiKeyMiddleware;
