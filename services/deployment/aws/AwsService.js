const awsEc2 = require("../../../config/cloudConfigs/awsConfig");

// **Wrapper Class to Rename Functions**
class AwsService {
  constructor() {
    this.awsService = awsEc2;
  }

  async listImages(params = {}) {
    try {
      const data = await this.awsService.describeImages(params).promise();
      console.log("listImages", data);

      return { success: true, data };
    } catch (error) {
      console.error("Error:", error);
      return {
        success: false,
        message: "Fetch Images failed.",
        error: error.message,
      };
    }
  }

  async listInstances(params = {}) {
    try {
      const data = await this.awsService.describeInstances(params).promise();
      console.log("listInstances", data);
      const instances = [];

      data.Reservations.forEach((reservation) => {
        reservation.Instances.forEach((instance) => {
          instances.push({
            instanceId: instance.InstanceId,
            state: instance.State.Name,
            instanceType: instance.InstanceType,
            launchTime: instance.LaunchTime,
            publicIp: instance.PublicIpAddress || "N/A",
            privateIp: instance.PrivateIpAddress || "N/A",
          });
        });
      });

      return { success: true, instances };
    } catch (error) {
      console.error("Error:", error);
      return {
        success: false,
        message: "Fetch Instances failed.",
        error: error.message,
      };
    }
  }

  async createDeployment(deploymentData) {
    try {
      const { imageId, instanceType, keyName, securityGroupIds } =
        deploymentData;

      if (!imageId || !instanceType) {
        return {
          success: false,
          error: "imageId and instanceType are required",
        };
      }

      const params = {
        ImageId: imageId, // e.g., "ami-1234567890abcdef0"
        InstanceType: instanceType, // e.g., "t2.micro"
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName, // Optional: Name of your EC2 key pair
        SecurityGroupIds: securityGroupIds, // Optional: Array of security group IDs
      };

      try {
        // const data = await this.awsService.runInstances(params).promise();
        // const instanceId = data.Instances[0].InstanceId;

        return {
          success: true,
          message: "Instance launched successfully",
          instanceId: "true",
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Deployment failed.",
        error: error.message,
      };
    }
  }

  async fetchAllDeployments() {
    return await this.listInstances();
  }

  async fetchDeploymentDetails(deploymentId) {
    const params = {
      InstanceIds: [deploymentId],
    };

    try {
      const data = await ec2.describeInstances(params).promise();
      if (data.Reservations.length === 0) {
        return { success: false, error: "No instance found with this ID." };
      }

      const instance = data.Reservations[0].Instances[0];

      const details = {
        InstanceId: instance.InstanceId,
        State: instance.State.Name,
        InstanceType: instance.InstanceType,
        ImageId: instance.ImageId,
        LaunchTime: instance.LaunchTime,
        PublicIp: instance.PublicIpAddress || "N/A",
        PrivateIp: instance.PrivateIpAddress || "N/A",
        SecurityGroups: instance.SecurityGroups.map((sg) => sg.GroupName),
        KeyName: instance.KeyName || "N/A",
        SubnetId: instance.SubnetId,
        VpcId: instance.VpcId,
        Tags: instance.Tags.reduce(
          (acc, tag) => ({ ...acc, [tag.Key]: tag.Value }),
          {}
        ),
      };

      return { success: true, details };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchAvailableImages() {
    const imageParams = {
      Owners: ["amazon"], // Only fetch Amazon-owned AMIs
      Filters: [
        { Name: "state", Values: ["available"] },
        { Name: "architecture", Values: ["x86_64"] },
        { Name: "virtualization-type", Values: ["hvm"] },
      ],
    };

    const allInstances = await this.listImages(imageParams);
    if (allInstances.success) {
      return allInstances.data;
    } else {
      return allInstances.error;
    }
  }

  async deploymentStatus(deploymentId) {
    const instanceId = deploymentId;

    if (!instanceId) {
      return { success: false, error: "Instance ID is required" };
    }

    try {
      const data = await this.awsService
        .describeInstances({ InstanceIds: [instanceId] })
        .promise();
      const state = data.Reservations[0].Instances[0].State.Name;
      return { success: true, instanceId, state };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async terminateDeployment(deploymentId) {
    const instanceId = deploymentId;

    if (!instanceId) {
      return { success: false, error: "Instance ID is required" };
    }

    const params = { InstanceIds: [instanceId] };

    try {
      const data = await this.awsService.stopInstances(params).promise();
      return {
        success: true,
        message: "Instance stopping...",
        instanceId: instanceId,
        state: data.StoppingInstances[0].CurrentState.Name,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fetchLeaseDetails(leaseId) {
    return this.awsService.getLeaseDetails(leaseId);
  }

  async terminateLease(leaseId) {
    return this.awsService.closeLease(leaseId);
  }

  async fetchUserBalance() {
    return this.awsService.getUserBalance();
  }

  async saveDepositBalance(amount) {
    return this.awsService.depositBalance(amount);
  }
}

// **Exporting the Renamed Class**
module.exports = AwsService;
