const express = require("express");
const walletRoutes = express.Router();

// Create a wallet
walletRoutes.post("/create", (req, res) => {
  const { name } = req.body;
  // Execute the corresponding CLI command
  const result = `sphnctl wallet create --name ${name}`;
  // Return result as response
  res.json({ message: `Wallet created: ${result}` });
});

// Get wallet balance
walletRoutes.get("/balance", (req, res) => {
  // Execute the corresponding CLI command
  const result = `sphnctl wallet balance`;
  res.json({ message: `Current wallet balance: ${result}` });
});

// Check current wallet
walletRoutes.get("/current", (req, res) => {
  const result = `sphnctl wallet current`;
  res.json({ message: `Current wallet in use: ${result}` });
});

// Switch wallet
walletRoutes.post("/use", (req, res) => {
  const { name, keySecret } = req.body;
  const result = `sphnctl wallet use --name ${name} --key-secret ${keySecret}`;
  res.json({ message: `Switched to wallet: ${result}` });
});

// Export private key
walletRoutes.get("/private-key", (req, res) => {
  const result = `sphnctl wallet private-key`;
  res.json({ message: `Private key exported: ${result}` });
});

module.exports = walletRoutes;
