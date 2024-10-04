const express = require("express");
const deploymentRoutes = express.Router();

// Create a deployment
deploymentRoutes.post("/create", (req, res) => {
  const { configFile } = req.body;  // Assuming the YAML file is sent as text or a file
  const result = `sphnctl deployment create ${configFile}`;
  res.json({ message: `Deployment created: ${result}` });
});

// Fetch deployment details
deploymentRoutes.get("/get/:lid", (req, res) => {
  const { lid } = req.params;
  const result = `sphnctl deployment get --lid ${lid}`;
  res.json({ message: `Deployment details: ${result}` });
});

// Fetch deployment logs
deploymentRoutes.get("/logs/:lid", (req, res) => {
  const { lid } = req.params;
  const { follow } = req.query; // Optional: follow parameter
  const result = `sphnctl deployment logs --lid ${lid} ${follow ? '--follow' : ''}`;
  res.json({ message: `Deployment logs: ${result}` });
});

// Update a deployment
deploymentRoutes.put("/update/:lid", (req, res) => {
  const { lid } = req.params;
  const { configFile } = req.body;
  const result = `sphnctl deployment update --lid ${lid} ${configFile}`;
  res.json({ message: `Deployment updated: ${result}` });
});

// Close a deployment
deploymentRoutes.delete("/close/:lid", (req, res) => {
  const { lid } = req.params;
  const result = `sphnctl deployment close --lid ${lid}`;
  res.json({ message: `Deployment closed: ${result}` });
});

module.exports = deploymentRoutes;
