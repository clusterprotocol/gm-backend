require("dotenv").config();
const AWS = require("aws-sdk");
const env = require("../env");

class AwsConfig {
  constructor() {
    this.awsConfig = {
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
      region: env.AWS_REGION,
    };

    // Initialize AWS Clients
    this.ec2 = new AWS.EC2(this.awsConfig);
    this.cloudWatchLogs = new AWS.CloudWatchLogs(this.awsConfig);
    this.ssm = new AWS.SSM(this.awsConfig);
    this.eventBridge = new AWS.EventBridge(this.awsConfig);
    this.iam = new AWS.IAM(this.awsConfig); // Added IAM Client
  }

  async getAccountId() {
    // const sts = new AWS.STS();
    // const identity = await sts.getCallerIdentity().promise();
    return "575108942815"; //identity.Account;
  }

  getEC2Client() {
    return this.ec2;
  }

  getCloudWatchLogsClient() {
    return this.cloudWatchLogs;
  }

  getSSMClient() {
    return this.ssm;
  }

  getEventBridgeClient() {
    return this.eventBridge;
  }

  getIAMClient() {
    return this.iam; // Added IAM client getter
  }
}

// Export a single instance of the class (Singleton Pattern)
module.exports = new AwsConfig();
