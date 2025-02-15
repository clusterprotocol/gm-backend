const Deployment = require("../models/deployments");
const shellHelper = require("../helpers/shellHelpers.js");

class CloudDAO {
  generateYamlConfigNew(data) {
    return `
version: "1.0"

services:
  py-cuda:
    image: ${data.image}
    expose:
      - port: ${data.port}
        as: ${data.port}
        to:
          - global: true
    env:
      - JUPYTER_TOKEN=sentient
profiles:
  name: py-cuda
  duration: ${data.rentalDuration}h
  mode: provider
  tier:
    - community
  compute:
    py-cuda:
      resources:
        cpu:
          units: 1
        memory:
          size: 16Gi
        storage:
          - size: 200Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: ${data.gpuName}
  placement:
    westcoast:
      attributes:
        region: ${data.location}
      pricing:
        py-cuda:
          token: CST
          amount: ${data.amount}

deployment:
  py-cuda:
    westcoast:
      profile: py-cuda
      count: 1
  `;
  }

  async saveDeploymentToDB(deploymentId, data, deploymentResponse) {
    const deployment = new Deployment({
      deploymentId: deploymentId,
      dockerImage: data.imageId,
      duration: data.rentalDuration,
      cloudProvider: data.cloudProvider,
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
      data: deploymentResponse,
    });
    return await deployment.save();
  }

  async getOrdersByUserAddress(userAddress) {
    return await Deployment.find({ walletAddress: userAddress });
  }

  async updateDeployment(deploymentId, updateData) {
    return await Deployment.findOneAndUpdate(
      { deploymentId: deploymentId },
      updateData,
      {
        new: true,
      }
    );
  }

  async updateDeploymentStatus(deploymentId, status) {
    return await Deployment.findOneAndUpdate(
      { deploymentId: deploymentId },
      { status },
      { new: true }
    );
  }
}

module.exports = CloudDAO;
