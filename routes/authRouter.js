const express = require("express");
const jwt = require("jsonwebtoken");

const authRoutes = express.Router();

// JWT Secret (store it in .env file)
const JWT_SECRET = process.env.JWTSECRET;

// Route for user authentication and JWT generation
authRoutes.post("/getToken", async (req, res) => {
  const { address } = req.body;
  console.log(req.body);
  try {
    // Recover address from the signature
    // const signerAddress = ethers.verifyMessage(message, signature);

    if (address) {
      // Generate a JWT
      const token = jwt.sign(address, JWT_SECRET, {});

      return res.json({
        success: true,
        message: "Authentication successful!",
        token, // Send the token to the client
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Authentication failed." });
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error verifying signature." });
  }
});

module.exports = authRoutes;
