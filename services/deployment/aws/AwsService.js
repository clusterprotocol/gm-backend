const AwsConfig = require("../../../config/cloudConfigs/awsConfig");
const env = require("../../../config/env");
const { cloudConfig } = require("../../../constants/cloudConfig");
const CommonFunction = require("../../../Utils/commonFunctions");
const awsAvailableImages = require("./awsAvailableImages.json");

// **Wrapper Class to Rename Functions**
class AwsService {
  constructor() {
    this.awsService = AwsConfig.getEC2Client();
    this.cloudWatchLogs = AwsConfig.getCloudWatchLogsClient();
    this.awsSsm = AwsConfig.getSSMClient();
    this.accountId = AwsConfig.getAccountId();
    this.eventBridge = AwsConfig.getEventBridgeClient();
    this.imageId = "ami-04b4f1a9cf54c11d0";
    this.commonFunctions = new CommonFunction();
    this.awsRegion = env.AWS_REGION;
  }

  async getInstanceArn(instanceId) {
    return `arn:aws:ec2:${this.awsRegion}:${this.accountId}:instance/${instanceId}`;
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
      const { imageId, instanceType, keyName, securityGroupIds } =
        deploymentData;

      console.log(
        "imageId, instanceType, keyName, securityGroupIds ",
        imageId,
        instanceType,
        keyName,
        securityGroupIds,
        deploymentData
      );

      if (!imageId || !instanceType) {
        return {
          success: false,
          message: "imageId and instanceType are required",
        };
      }

      // const params = {
      //   ImageId: this.imageId, // e.g., "ami-1234567890abcdef0"
      //   InstanceType: instanceType, // e.g., "t2.micro"
      //   MinCount: 1,
      //   MaxCount: 1,
      //   KeyName: keyName, // Optional: Name of your EC2 key pair
      //   SecurityGroupIds: securityGroupIds, // Optional: Array of security group IDs
      // };

      try {
        // const data = await this.awsService.runInstances(params).promise();
        // const instanceId = data.Instances[0].InstanceId;

        // await this.enableCloudWatchLogs(instanceId);
        // const data = {};
        // const instanceId = "i-079fe8120c147ada2";
        const roleName = "TerminateEc2Instance";

        // const attachIam = await this.addIAMRoleToInstance(instanceId, roleName);
        // if (!attachIam.success) {
        //   return {
        //     success: false,
        //     message: "Deployment failed.",
        //     error: error.message,
        //   };
        // }

        // const scheduler = await this.scheduleTermination(instanceId, 3);
        // if (!scheduler.success) {
        //   return {
        //     success: false,
        //     message: "Deployment failed.",
        //     error: error.message,
        //   };
        // }

        const terminationTime = "2025-02-17T12:45:00Z";
        const instanceName = "aghjdashjd";

        const userData = `#!/bin/bash
        LOG_FILE="/home/ubuntu/termination-check.log"
        SCRIPT_PATH="/home/ubuntu/termination-check.sh"
        
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Script started" | tee -a $LOG_FILE
        
        INSTANCE_NAME="${instanceName}"
        TERMINATION_TIME="${terminationTime}"
        
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Termination Time set to: $TERMINATION_TIME" | tee -a $LOG_FILE
        
        # Create the termination script
        cat << 'EOF' > $SCRIPT_PATH
        #!/bin/bash
        LOG_FILE="/home/ubuntu/termination-check.log"
        
        log_message() {
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - $1" | tee -a $LOG_FILE
        }
        
        log_message "Termination Script Running"
        
        INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=${instanceName}" --query 'Reservations[0].Instances[0].InstanceId' --output text)
        TERMINATION_TIME="${terminationTime}"
        
        while true; do
            CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            log_message "Checking Termination Condition. Current Time: $CURRENT_TIME"
        
            if [[ "$CURRENT_TIME" > "$TERMINATION_TIME" ]]; then
                log_message "Terminating Instance: $INSTANCE_ID"
                aws ec2 terminate-instances --instance-ids $INSTANCE_ID
                break
            fi
            sleep 1
        done
        EOF
        
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Termination script created" | tee -a $LOG_FILE
        
        # Set permissions
        chmod +x $SCRIPT_PATH
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Script permissions set to executable" | tee -a $LOG_FILE
        
        # Check if AWS CLI is installed
        if ! command -v aws &> /dev/null; then
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - AWS CLI not found, installing..." | tee -a $LOG_FILE
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip awscliv2.zip
            sudo ./aws/install
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - AWS CLI installed" | tee -a $LOG_FILE
        fi
        
        # Start script in background with nohup
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Starting termination script in background" | tee -a $LOG_FILE
        nohup bash $SCRIPT_PATH > /dev/null 2>&1 & 
        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Termination script started in background" | tee -a $LOG_FILE
        `;

        const params = {
          ImageId: this.imageId, // Hardcoded AMI ID
          InstanceType: instanceType,
          MinCount: 1,
          MaxCount: 1,
          KeyName: keyName,
          SecurityGroupIds: securityGroupIds,
          UserData: Buffer.from(userData).toString("base64"),
          IamInstanceProfile: { Name: roleName }, // Ensure IAM role is assigned
          TagSpecifications: [
            {
              ResourceType: "instance",
              Tags: [
                { Key: "termination_time", Value: terminationTime },
                { Key: "name", Value: instanceName },
              ],
            },
          ],
        };

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

  async getLogs(logStreamName, logGroupName = "/var/log/instance-logs") {
    try {
      const data1 = await this.cloudWatchLogs.describeLogGroups().promise();
      console.log(
        "Available Log Groups:",
        data1.logGroups.map((g) => g.logGroupName)
      );
      const params = {
        logGroupName,
        logStreamName,
      };

      console.log("aws log params ", params);

      const data = await this.cloudWatchLogs.getLogEvents(params).promise();
      console.log("aws logs ", data);
      return {
        success: true,
        logs: data.events.map((event) => ({
          timestamp: new Date(event.timestamp).toISOString(),
          message: event.message,
        })),
      };
    } catch (error) {
      console.error("Error fetching logs:", error);
      return { success: false, error: error.message };
    }
  }
}

// **Exporting the Renamed Class**
module.exports = AwsService;
