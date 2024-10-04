const { Router: expressRouter } = require("express");
const router = expressRouter();

const deploymentRoutes = require("./deploymentRoutes.js");
const paymentRoutes = require("./paymentRoutes.js");
const walletRoutes = require("./walletRoutes.js");
const apiKeyMiddleware = require("../../middleware/apiKeyMiddleWare.js");

// Protected routes
router.use(apiKeyMiddleware);
// router.use("/deploy", deploymentRoutes);
// router.use("/payment", paymentRoutes);
// router.use("/wallet", walletRoutes);

const express = require("express");

const shell = require("shelljs");
const Deployment = require("../../models/deployments.js");


// Create Deployment & Fetch Deployment Info
router.post("/deployment/create", async (req, res) => {
  const { name, location, gpuName, machineId, amount, image, port, rentalDuration, userAddress } = req.body;
console.log(req.body);
  // Create the YAML file based on API input
  const yamlConfig = `
version: "1.0"
services:
  gpu-test:
    image: ${image}
    expose:
      - port: ${port}
        as: 80
        to:
          - global: true
    env:
      - TEST=test
profiles:
  name: hello-world
  mode: provider
  duration: ${rentalDuration}h
  tier:
    - community
  compute:
    gpu-test:
      resources:
        cpu:
          units: 1
        memory:
          size: 20Gi
        storage:
          - size: 100Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: ${gpuName}
  placement:
    westcoast:
      attributes:
        region: us-west
      pricing:
        gpu-test:
          token: USDT
          amount: ${amount+1}
deployment:
  gpu-test:
    westcoast:
      profile: gpu-test
      count: 1
`;
console.log(yamlConfig)
  // Write YAML to file (gpu.yml)
  shell.ShellString(yamlConfig).to('gpu.yml');

  // Run the deployment command
  const command = `sphnctl deployment create gpu.yml`;

  shell.exec(command, async (code, stdout, stderr) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, error: stderr });
    }

    // Assuming deployment ID can be extracted from stdout
    const deploymentId = extractDeploymentId(stdout);

    if (!deploymentId) {
      return res.status(500).json({ success: false, error: "Failed to extract deployment ID." });
    }

    // Fetch Deployment Details
    const fetchCommand = `sphnctl deployment get --lid ${deploymentId}`;

    shell.exec(fetchCommand, async (fetchCode, fetchStdout, fetchStderr) => {
      if (fetchCode !== 0) {
        return res.status(500).json({ success: false, error: fetchStderr });
      }

      // Save deployment details to MongoDB
      const deployment = new Deployment({
        deploymentid: deploymentId,
        dockerImage: image,
        duration: rentalDuration,
        cpuname: name,
        gpuname: gpuName,
        cpuVRam: 20,
        totalRam: 20,
        memorySize: 100,
        coreCount: 1,
        ipAddr: "192.168.0.1",
        openedPorts: [port],
        region: location,
        bidprice: amount,
        walletAddress: userAddress,
        data: parseShellOutput(fetchStdout)
      });

      try {
        await deployment.save();
        res.status(201).json({
            success: true,
            message: "Deployment created successfully",
            deployment: {
              deploymentId,
              ...req.body,
              statusDetails: parseShellOutput(fetchStdout), // Parsed JSON response from status command
            },
          });  
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  });
});

// Fetch User Orders
router.post("/deployment/getOrders", async (req, res) => {
    const { userAddress } = req.body;
  
    if (!userAddress) {
      return res.status(400).json({ success: false, message: "User address is required" });
    }
  
    try {
      // Query MongoDB to get all deployments related to the user's wallet address
      const orders = await Deployment.find({ walletAddress: userAddress });
  
      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: "No orders found for this user" });
      }
  
      // Construct the response with deployment details
      const orderDetails = orders.map(order => ({
        deploymentId: order.deploymentid,
        name: order.cpuname,
        location: order.region,
        gpuName: order.gpuname,
        rentalDuration: order.duration,
        machineId: order.gpuname,
        image: order.dockerImage,
        port: order.openedPorts[0],
        amount: order.bidprice,
        statusDetails: order.data
      }));
  
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders: orderDetails
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
    }
  });
  
// Fetch Deployment Events
router.get("/deployment/events/:deploymentId", async (req, res) => {
    const { deploymentId } = req.params;
    const command = `sphnctl deployment events --lid ${deploymentId}`;
  
    shell.exec(command, async (code, stdout, stderr) => {
      if (code !== 0) {
        return res.status(500).json({ success: false, error: stderr });
      }
  
      try {
        // Check if stdout is empty
        if (stdout.trim() === "") {
          // Update the order's data.status to 'Offline' in the database
          await Deployment.findOneAndUpdate(
            { deploymentid: deploymentId },
            { 'data.status': "Offline" }
          );
          return res.status(200).json({
            success: true,
            message: `Events for Deployment ID: ${deploymentId}`,
            events: stdout, // blank output
            statusUpdated: 'Offline',
          });
        } else {
          res.status(200).json({
            success: true,
            message: `Events for Deployment ID: ${deploymentId}`,
            events: stdout, // Assuming stdout contains structured data
          });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  });
  
  // Fetch Deployment Logs
  router.get("/deployment/logs/:deploymentId", async (req, res) => {
    const { deploymentId } = req.params;
    const command = `sphnctl deployment logs --lid ${deploymentId}`;
  
    shell.exec(command, async (code, stdout, stderr) => {
      if (code !== 0) {
        return res.status(500).json({ success: false, error: stderr });
      }
  
      try {
        // Check if stdout is empty
        if (stdout.trim() === "") {
          // Update the order's data.status to 'Offline' in the database
          await Deployment.findOneAndUpdate(
            { deploymentid: deploymentId },
            { 'data.status': "Offline" }
          );
          return res.status(200).json({
            success: true,
            message: `Logs for Deployment ID: ${deploymentId}`,
            events: stdout, // blank output
            statusUpdated: 'Offline',
          });
        } else {
          res.status(200).json({
            success: true,
            message: `Logs for Deployment ID: ${deploymentId}`,
            events: stdout, // Assuming stdout contains structured data
          });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  });
  
// Update Deployment
router.put("/deployment/update/:deploymentId", async (req, res) => {
  const { deploymentId } = req.params;
  const updateData = req.body;

  try {
    const updatedDeployment = await Deployment.findOneAndUpdate(
      { deploymentid: deploymentId },
      updateData,
      { new: true }
    );
    if (!updatedDeployment) {
      return res.status(404).json({ success: false, message: "Deployment not found" });
    }

    res.status(200).json({
      success: true,
      message: `Deployment ID: ${deploymentId} updated successfully`,
      updatedDeployment,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close Deployment
router.get("/deployment/close/:deploymentId", (req, res) => {
  const { deploymentId } = req.params;
  const command = `sphnctl deployment close --lid ${deploymentId}`;

  shell.exec(command, async (code, stdout, stderr) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, error: stderr });
    }

    try {
      // Update deployment status to closed in MongoDB
      await Deployment.findOneAndUpdate(
        { deploymentid: deploymentId },
        { 'data.status': "Offline" }
    );
      res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} closed successfully`,
        response: stdout, // Structured JSON response
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

// Helper function to extract Deployment ID from output
function extractDeploymentId(output) {
  // Regex to extract deployment ID from stdout
  const deploymentIdMatch = output.match(/lid: (\d+)/);
  return deploymentIdMatch ? deploymentIdMatch[1] : null;
}

// Helper function to parse shell output into structured JSON
// Helper function to parse shell output into structured data
function parseShellOutput(output) {
    try {
      // Attempt to parse as JSON (in case the output might change in the future)
      return JSON.parse(output);
    } catch (e) {
      // If JSON parse fails, handle as plain text.
      console.log(e, output)
      // Extract deployment status details using regex and string matching
      const deploymentIdMatch = output.match(/Status of the deployment ID: (\d+)/);
      const statusMatch = output.match(/Status: (\w+)/);
      const providerMatch = output.match(/Provider: (0x[a-fA-F0-9]+)/);
      const priceMatch = output.match(/Price per hour: (\d+\.\d+)/);
      const startTimeMatch = output.match(/Start time: ([\w\-T:.Z]+)/);
      
      // Extract service details (like URL, Ports, Replicas)
      const servicesMatch = output.match(/Services running:\n\s+(\w+)/);
      const urlMatch = output.match(/URL:\s*\[([^\]]*)\]/);
      const portsMatch = output.match(/Ports:\n\s+- ([^ ]+) -> (\d+) \(TCP\)/);
      const replicasMatch = output.match(/Replicas: (\d+)\/(\d+) available, (\d+) ready/);
      const hostUriMatch = output.match(/Host URI: ([^\n]+)/);
      const regionMatch = output.match(/Region: ([^\n]+)/);
      
      // Return a structured object with extracted details
      return {
        deploymentId: deploymentIdMatch ? deploymentIdMatch[1] : null,
        status: statusMatch ? statusMatch[1] : null,
        provider: providerMatch ? providerMatch[1] : null,
        pricePerHour: priceMatch ? parseFloat(priceMatch[1]) : null,
        startTime: startTimeMatch ? startTimeMatch[1] : null,
        services: {
          name: servicesMatch ? servicesMatch[1] : null,
          url: urlMatch && urlMatch[1] ? urlMatch[1].split(',') : [],
          ports: portsMatch ? `${portsMatch[1]} -> ${portsMatch[2]}` : null,
          replicas: replicasMatch ? {
            available: replicasMatch[1],
            total: replicasMatch[2],
            ready: replicasMatch[3]
          } : null,
          hostUri: hostUriMatch ? hostUriMatch[1] : null,
          region: regionMatch ? regionMatch[1] : null,
        },
        raw: output // Provide the raw output for debugging purposes
      };
    }
  }
  

module.exports = router;
