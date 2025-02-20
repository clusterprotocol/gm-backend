const AwsConfig = require("../../../config/cloudConfigs/awsConfig");
const env = require("../../../config/env");
const { cloudConfig } = require("../../../constants/cloudConfig");
const CommonFunction = require("../../../Utils/commonFunctions");
const ContainerService = require("../../containerServices/containerServices");
const awsAvailableImages = require("./awsAvailableImages.json");

// **Wrapper Class to Rename Functions**
class AwsService {
  constructor() {
    this.awsService = AwsConfig.getEC2Client();
    this.cloudWatchLogs = AwsConfig.getCloudWatchLogsClient();
    this.awsSsm = AwsConfig.getSSMClient();
    this.accountId = AwsConfig.getAccountId();
    this.eventBridge = AwsConfig.getEventBridgeClient();
    this.imageId = "ami-037606826db251f82";
    this.securityGroupIds = ["sg-03308e6c4d569b20c"];
    this.commonFunctions = new CommonFunction();
    this.awsRegion = env.AWS_REGION;
    this.containerService = new ContainerService();
  }

  async getPublicIp(deploymentId) {
    try {
      const params = { InstanceIds: [deploymentId] };
      const response = await this.awsService
        .describeInstances(params)
        .promise();

      const instance = response.Reservations?.[0]?.Instances?.[0];
      if (!instance) {
        throw new Error(`Instance ${deploymentId} not found`);
      }

      const publicIp = instance.PublicIpAddress;
      return publicIp;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getInstanceArn(instanceId) {
    return `arn:aws:ec2:${this.awsRegion}:${this.accountId}:instance/${instanceId}`;
  }

  async getAmiIdByName(amiName) {
    const params = {
      Filters: [{ Name: "name", Values: [amiName] }],
    };
    const result = await this.awsService.describeImages(params).promise();
    console.log("ami id ", result);
    return result.Images.length > 0 ? result.Images[0].ImageId : null;
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

  async enableCloudWatchLogs(instanceId) {
    const params = {
      DocumentName: "AWS-ConfigureCloudWatch",
      InstanceIds: [instanceId],
      Parameters: {
        LogGroupName: ["/aws/ec2/instance-logs"], // Define a log group name
        LogStreamName: [instanceId], // Use instance ID as log stream
      },
    };

    try {
      const response = await this.awsSsm.sendCommand(params).promise();
      console.log("CloudWatch Logs Enabled:", response);
    } catch (error) {
      console.error("Error enabling CloudWatch Logs:", error);
    }
  }

  async addIAMRoleToInstance(instanceId, roleName) {
    try {
      // Associate the IAM Role with the EC2 instance
      const params = {
        IamInstanceProfile: {
          Name: roleName, // IAM Role Name
        },
        InstanceId: instanceId, // EC2 Instance ID
      };

      const result = await this.awsService
        .associateIamInstanceProfile(params)
        .promise();
      return { success: true };
    } catch (error) {
      console.error("Error attaching IAM Role:", error.message);
    }
  }

  getCronExpressionFromDate(durationInHours) {
    const date = new Date();
    date.setMinutes(date.getMinutes() + durationInHours);

    const min = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // AWS months are 1-based

    return `cron(${min} ${hour} ${day} ${month} ? *)`;
  }

  async scheduleTermination(instanceId, durationInHours) {
    const ruleName = `terminate-instance-${instanceId}`;
    const cronExpression = this.getCronExpressionFromDate(durationInHours);

    console.log("cronExpression ", cronExpression);

    const ruleParams = {
      Name: ruleName,
      ScheduleExpression: cronExpression,
      State: "ENABLED",
      Description: `Terminate EC2 instance ${instanceId} after ${durationInHours} hours`,
    };

    try {
      const ruleResponse = await this.eventBridge.putRule(ruleParams).promise();
      console.log("Rule Created Successfully:", ruleResponse);

      const lambdaArn = env.AWS_LAMBDA_TERMINATEEC2INSTANCE;

      const targetResponse = await this.eventBridge
        .putTargets({
          Rule: ruleName,
          Targets: [
            { Arn: lambdaArn, Id: "1", Input: JSON.stringify({ instanceId }) },
          ],
        })
        .promise();

      console.log("Target Attached Successfully:", targetResponse);

      return { success: true, ruleResponse, targetResponse };
    } catch (error) {
      console.error("Error scheduling termination:", error);
      return { success: false, error: error.message };
    }
  }

  async createDeployment(deploymentData) {
    try {
      const { imageId, instanceType, keyName } = deploymentData;

      if (!imageId || !instanceType) {
        return {
          success: false,
          message: "imageId and instanceType are required",
        };
      }

      const roleName = "TerminateEc2Instance";
      const params = {
        ImageId: this.imageId, // Hardcoded AMI ID
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
        SecurityGroupIds: this.securityGroupIds,
        IamInstanceProfile: { Name: roleName }, // Ensure IAM role is assigned
        InstanceInitiatedShutdownBehavior: "terminate",
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [
              {
                Key: "Name",
                Value: `UserGeneratedFromGpuMarketplace-${this.commonFunctions.generateRandomString()}`,
              },
            ],
          },
        ],
      };

      console.log("params ", params);

      const data = await this.awsService.runInstances(params).promise();
      const instanceId = data.Instances[0].InstanceId;

      return {
        success: true,
        message: "Instance launched successfully",
        instanceId: "true",
        response: data,
        deploymentId: instanceId,
      };
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
    const gpuImages = awsAvailableImages.instances;
    const processedData = gpuImages.map((gpu) => ({
      machineId: this.commonFunctions.generateRandomString(),
      availableNum: gpu.availableNum || 10,
      cpuName: gpu.gpu_name,
      gpuName: gpu.gpu_name,
      portsOpen: [8080],
      region: env.AWS_REGION,
      bidPrice: gpu.hourly_price,
      cloudProvider: cloudConfig.AWS,
      instanceType: gpu.instance_type,
      vcpu: gpu.vcpu,
      memory: gpu.memory,
      storage: gpu.storage || 200,
    }));
    return processedData;
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

  async getEvents(instanceId) {
    try {
      const params = {
        Filters: [{ Name: "resource-id", Values: [instanceId] }],
      };

      const data = await this.awsService
        .describeInstanceStatus(params)
        .promise();
      if (data.InstanceStatuses.length === 0) {
        return { success: false, message: "No events found" };
      }

      console.log("aws events ", data);

      return {
        success: true,
        events: data.InstanceStatuses[0].Events || [],
      };
    } catch (error) {
      console.error("Error fetching instance events:", error);
      return { success: false, error: error.message };
    }
  }

  async getLogs(data) {
    try {
      const publicIp = await this.getPublicIp(data.deploymentId);
      const containerId = data.containerId;
      const logs = await this.containerService.getContainerLogs(
        publicIp,
        containerId
      );

      console.log("instance ", logs);

      return { success: true, logs };
      // const data1 = await this.cloudWatchLogs.describeLogGroups().promise();
      // console.log(
      //   "Available Log Groups:",
      //   data1.logGroups.map((g) => g.logGroupName)
      // );
      // const params = {
      //   logGroupName,
      //   logStreamName,
      // };

      // console.log("aws log params ", params);

      // const data = await this.cloudWatchLogs.getLogEvents(params).promise();
      // console.log("aws logs ", data);
      // return {
      //   success: true,
      //   logs: data.events.map((event) => ({
      //     timestamp: new Date(event.timestamp).toISOString(),
      //     message: event.message,
      //   })),
      // };
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw new Error(error.message);
    }
  }

  async initiateContainerServices(deployment) {
    try {
      const publicIp = await this.getPublicIp(deployment.deploymentId);
      const startingDocker = await this.containerService.initSSH(
        publicIp,
        deployment
      );

      console.log("instance ", startingDocker);

      return startingDocker;
    } catch (error) {
      console.error("Error fetching public IP:", error);
      throw new Error(error.message);
    }
  }
}

// **Exporting the Renamed Class**
module.exports = AwsService;
