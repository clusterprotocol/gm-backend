const Deployment = require("../models/deployments");

const generateYamlConfig = (data) => {
  return `
version: "1.0"
services:
  gpu-test:
    image: ${data.image}
    expose:
      - port: ${data.port}
        as: 80
        to:
          - global: true
    env:
      - TEST=test
profiles:
  name: hello-world
  mode: provider
  duration: ${data.rentalDuration}h
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
                - model: ${data.gpuName}
  placement:
    ${data.location}:
      attributes:
        region: ${data.location}
      pricing:
        gpu-test:
          token: USDT
          amount: ${data.amount + 1}
deployment:
  gpu-test:
    ${data.location}:
      profile: gpu-test
      count: 1
`;
};

const saveDeploymentToDB = async (deploymentId, data, shellOutput) => {
  const deployment = new Deployment({
    deploymentid: deploymentId,
    dockerImage: data.image,
    duration: data.rentalDuration,
    cpuname: data.name,
    gpuname: data.gpuName,
    cpuVRam: 20,
    totalRam: 20,
    memorySize: 100,
    coreCount: 1,
    ipAddr: "192.168.0.1",
    openedPorts: [data.port],
    region: data.location,
    bidprice: data.amount,
    walletAddress: data.userAddress,
    data: shellHelper.parseShellOutput(shellOutput),
  });
  return deployment.save();
};

const getOrdersByUserAddress = (userAddress) =>
  Deployment.find({ walletAddress: userAddress });
const updateDeployment = (deploymentId, updateData) =>
  Deployment.findOneAndUpdate({ deploymentid: deploymentId }, updateData, {
    new: true,
  });
const updateDeploymentStatus = (deploymentId, status) =>
  Deployment.findOneAndUpdate(
    { deploymentid: deploymentId },
    { "data.status": status, status },
    { new: true }
  );

module.exports = {
  generateYamlConfig,
  saveDeploymentToDB,
  getOrdersByUserAddress,
  updateDeployment,
  updateDeploymentStatus,
};
