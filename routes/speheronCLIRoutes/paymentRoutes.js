const express = require("express");
const paymentRoutes = express.Router();

// Deposit funds
paymentRoutes.post("/deposit", (req, res) => {
  const { amount, token } = req.body;
  const result = `sphnctl payment deposit --amount ${amount} --token ${token}`;
  res.json({ message: `Funds deposited: ${result}` });
});

// Withdraw funds
paymentRoutes.post("/withdraw", (req, res) => {
  const { amount, token } = req.body;
  const result = `sphnctl payment withdraw --amount ${amount} --token ${token}`;
  res.json({ message: `Funds withdrawn: ${result}` });
});

// Get balance for specific token
paymentRoutes.get("/balance", (req, res) => {
  const { token } = req.query;
  const result = `sphnctl wallet balance --token ${token}`;
  res.json({ message: `Token balance: ${result}` });
});

// List all tokens
paymentRoutes.get("/tokens", (req, res) => {
  const result = `sphnctl payment tokens`;
  res.json({ message: `Available tokens: ${result}` });
});

module.exports = paymentRoutes;
