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
const userRegister = require("../../models/userRegister.js");
const Transaction = require("../../models/transaction.js");

// Create Deployment & Fetch Deployment Info
router.post("/deployment/create", async (req, res) => {
  const {
    name,
    location,
    gpuName,
    machineId,
    region,
    amount,
    image,
    port,
    rentalDuration,
    userAddress,
  } = req.body;
  console.log(req.body);
  // Create the YAML file based on API input
  const yamlConfig = `
version: "1.0"

services:
  py-cuda:
    image: ${image}
    expose:
      - port: ${port}
        as: ${port}
        to:
          - global: true
    env:
      - JUPYTER_TOKEN=sentient
profiles:
  name: py-cuda
  duration: ${rentalDuration}h
  mode: provider
  tier:
    - community
  compute:
    py-cuda:
      resources:
        cpu:
          units: 10
        memory:
          size: 16Gi
        storage:
          - size: 200Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: ${gpuName}
  placement:
    westcost:
      attributes:
        region: ${location}
      pricing:
        py-cuda:
          token: CST
          amount: ${amount}

deployment:
  py-cuda:
    westcost:
      profile: py-cuda
      count: 1
`;

  // Write YAML to file (gpu.yml)
  shell.ShellString(yamlConfig).to("gpu.yml");

  // Run the deployment command
  const command = `sphnctl deployment create gpu.yml`;

  shell.exec(command, async (code, stdout, stderr) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, error: stderr });
    }

    console.log("stdout ", stdout);

    // Assuming deployment ID can be extracted from stdout
    const deploymentId = extractDeploymentId(stdout);
    console.log("deploymentID", deploymentId);
    if (!deploymentId) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to extract deployment ID." });
    }

    // Fetch Deployment Details
    const fetchCommand = `sphnctl deployment get --lid ${deploymentId}`;

    shell.exec(fetchCommand, async (fetchCode, fetchStdout, fetchStderr) => {
      if (fetchCode !== 0) {
        return res.status(500).json({ success: false, error: fetchStderr });
      }

      const shellOutputToJson = parseShellOutput(fetchStdout);
      console.log("shellOutputToJson ", shellOutputToJson);

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
        data: shellOutputToJson,
      });

      try {
        await deployment.save();

        const user = await userRegister.findOne({ userAddress: userAddress });
        let previousBalance = JSON.parse(JSON.stringify(user.wallet.balance));
        console.log("previousBalance", user.wallet.balance);
        let finalBalance = user.wallet.balance - shellOutputToJson.pricePerHour; // Subtract money
        user.wallet.balance = finalBalance;
        console.log("finalBalance", user.wallet.balance);
        await user.save();

        // creating a credit transaction
        const transaction = new Transaction({
          userAddress,
          amount: shellOutputToJson.pricePerHour,
          deploymentId,
          type: "debit",
          previousBalance,
          finalBalance,
        });

        await transaction.save();

        return res.status(201).json({
          success: true,
          message: "Deployment created successfully",
          deployment: {
            deploymentId,
            ...req.body,
            statusDetails: parseShellOutput(fetchStdout), // Parsed JSON response from status command
          },
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });
  });
});

// Fetch User Orders
router.post("/deployment/getOrders", async (req, res) => {
  const { userAddress } = req.body;

  if (!userAddress) {
    return res
      .status(400)
      .json({ success: false, message: "User address is required" });
  }

  try {
    // Query MongoDB to get all deployments related to the user's wallet address
    const orders = await Deployment.find({ walletAddress: userAddress });

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found for this user" });
    }

    // Construct the response with deployment details
    const orderDetails = orders.map((order) => ({
      deploymentId: order.deploymentid,
      name: order.cpuname,
      location: order.region,
      gpuName: order.gpuname,
      rentalDuration: order.duration,
      machineId: order.gpuname,
      image: order.dockerImage,
      port: order.openedPorts[0],
      amount: order.bidprice,
      statusDetails: order.data,
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
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
          { "data.status": "Offline", status: "Offline" }
        );
        return res.status(200).json({
          success: true,
          message: `Events for Deployment ID: ${deploymentId}`,
          events: stdout, // blank output
          statusUpdated: "Offline",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: `Events for Deployment ID: ${deploymentId}`,
          events: stdout, // Assuming stdout contains structured data
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
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
          { "data.status": "Offline", status: "Offline" }
        );
        return res.status(200).json({
          success: true,
          message: `Logs for Deployment ID: ${deploymentId}`,
          events: stdout, // blank output
          statusUpdated: "Offline",
        });
      } else {
        return res.status(200).json({
          success: true,
          message: `Logs for Deployment ID: ${deploymentId}`,
          events: stdout, // Assuming stdout contains structured data
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
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
      return res
        .status(404)
        .json({ success: false, message: "Deployment not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Deployment ID: ${deploymentId} updated successfully`,
      updatedDeployment,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Close Deployment
router.get("/deployment/close/:deploymentId", (req, res) => {
  const { userAddress } = req.body;

  const { deploymentId } = req.params;
  const command = `sphnctl deployment close --lid ${deploymentId}`;

  shell.exec(command, async (code, stdout, stderr) => {
    console.log(code, stdout, stderr);
    if (code !== 0) {
      return res.status(500).json({ success: false, error: stderr });
    }

    try {
      const deploymentData = await Deployment.findOneAndUpdate(
        { deploymentid: deploymentId },
        { "data.status": "Offline", status: "Offline" }
      );

      // checking for deplyment is active or not
      const deploymentRunningTime =
        Date.now() / 3600000 -
        new Date(deploymentData.createdAt).getTime() / 3600000;

      const isDeploymentActive =
        deploymentRunningTime < deploymentData.duration; //converting hour into milisec for comaprision

      if (isDeploymentActive) {
        console.log("Deployment is still active.");

        //caculating remaining amount
        const remainingAmount =
          (deploymentData.duration - deploymentRunningTime) *
          deploymentData.data.pricePerHour;

        console.log("remainingAmount ", remainingAmount);

        // console.log(
        //   "remainingAmount",
        //   deploymentData.duration,
        //   deploymentRunningTime,
        //   deploymentData.duration - deploymentRunningTime,
        //   remainingAmount
        // );

        // adding amount to user wallet
        const user = await userRegister.findOne({ userAddress: userAddress });
        let previousBalance = JSON.parse(JSON.stringify(user.wallet.balance));
        console.log("previousBalance", user.wallet.balance);
        let finalBalance = user.wallet.balance + remainingAmount;
        user.wallet.balance = finalBalance;
        console.log("finalBalance", user.wallet.balance);
        await user.save();

        // creating a credit transaction
        const transaction = new Transaction({
          userAddress,
          amount: remainingAmount,
          deploymentId,
          type: "credit",
          previousBalance,
          finalBalance,
        });

        await transaction.save();
      }

      return res.status(200).json({
        success: true,
        message: `Deployment ID: ${deploymentId} closed successfully`,
        response: stdout, // Structured JSON response
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

// Helper function to extract Deployment ID from output
function extractDeploymentId(output) {
  // Regex to extract deployment ID from stdout

  const deploymentIdMatch = output.match(/Lid: (\d+)/);
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
    console.log(e, output);
    // Extract deployment status details using regex and string matching
    const deploymentIdMatch = output.match(
      /Status of the deployment ID: (\d+)/
    );
    const statusMatch = output.match(/Status: (\w+)/);
    const providerMatch = output.match(/Provider: (0x[a-fA-F0-9]+)/);
    const priceMatch = output.match(/Price per hour: (\d+\.\d+)/);
    const startTimeMatch = output.match(/Start time: ([\w\-T:.Z]+)/);

    // Extract service details (like URL, Ports, Replicas)
    const servicesMatch = output.match(/Services running:\n\s+(\w+)/);
    const urlMatch = output.match(/URL:\s*\[([^\]]*)\]/);
    const portsMatch = output.match(/Ports:\n\s+- ([^ ]+) -> (\d+) \(TCP\)/);
    const replicasMatch = output.match(
      /Replicas: (\d+)\/(\d+) available, (\d+) ready/
    );
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
        url: urlMatch && urlMatch[1] ? urlMatch[1].split(",") : [],
        ports: portsMatch ? `${portsMatch[1]} -> ${portsMatch[2]}` : null,
        replicas: replicasMatch
          ? {
              available: replicasMatch[1],
              total: replicasMatch[2],
              ready: replicasMatch[3],
            }
          : null,
        hostUri: hostUriMatch ? hostUriMatch[1] : null,
        region: regionMatch ? regionMatch[1] : null,
      },
      raw: output, // Provide the raw output for debugging purposes
    };
  }
}

module.exports = router;
