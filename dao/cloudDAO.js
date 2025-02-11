const Deployment = require("../models/deployments");
const shellHelper = require("../helpers/shellHelpers.js");

class CloudDAO {
  static generateYamlConfigNew(data) {
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
    ${data.location}:
      attributes:
        region: ${data.location}
      pricing:
        py-cuda:
          token: CST
          amount: ${data.amount + 1}

deployment:
  py-cuda:
    ${data.location}:
      profile: py-cuda
      count: 1
  `;
  }

  static async saveDeploymentToDB(deploymentId, data, deploymentResponse) {
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
      data: deploymentResponse,
    });
    return deployment.save();
  }

  static getOrdersByUserAddress(userAddress) {
    return Deployment.find({ walletAddress: userAddress });
  }

  static updateDeployment(deploymentId, updateData) {
    return Deployment.findOneAndUpdate(
      { deploymentid: deploymentId },
      updateData,
      {
        new: true,
      }
    );
  }

  static updateDeploymentStatus(deploymentId, status) {
    return Deployment.findOneAndUpdate(
      { deploymentid: deploymentId },
      { "data.status": status, status },
      { new: true }
    );
  }
}

module.exports = CloudDAO;
