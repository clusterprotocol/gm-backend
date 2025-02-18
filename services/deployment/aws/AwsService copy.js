const AwsConfig = require("../../../config/cloudConfigs/awsConfig");
const env = require("../../../config/env");
const { cloudConfig } = require("../../../constants/cloudConfig");
const CommonFunction = require("../../../Utils/commonFunctions");
const awsAvailableImages = require("./awsAvailableImages.json");

// **Wrapper Class to Rename Functions**
class AwsService {
  constructor() {
    this.awsService = AwsConfig.getEC2Client();
    this.iamService = AwsConfig.getIAMClient();
    this.commonFunctions = new CommonFunction();
    this.awsRegion = env.AWS_REGION;
    this.imageId = "ami-04b4f1a9cf54c11d0";
    this.instanceType = "t2.micro";
    this.keyName = "EC2SelfTerminateKey";
    this.iamRoleName = "EC2SelfTerminateRole";
    this.instanceProfileName = "EC2SelfTerminateProfile";
    this.securityGroup = "default";
  }

  async createIAMRole() {
    const iamClient = this.iamService;

    // Create IAM Role for EC2 termination
    const rolePolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "ec2.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    };

    try {
      await iamClient
        .createRole({
          RoleName: this.iamRoleName,
          AssumeRolePolicyDocument: JSON.stringify(rolePolicyDocument),
        })
        .promise();
      console.log(`✅ IAM Role '${this.iamRoleName}' created successfully.`);
    } catch (error) {
      if (error.code !== "EntityAlreadyExistsException") {
        console.error("Error creating IAM Role:", error);
      } else {
        console.log(`⚠️ IAM Role '${this.iamRoleName}' already exists.`);
      }
    }

    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["ec2:DescribeInstances", "ec2:TerminateInstances"],
          Resource: "*",
        },
      ],
    };

    try {
      await iamClient
        .putRolePolicy({
          RoleName: this.iamRoleName,
          PolicyName: "TerminateSelfAndDescribe",
          PolicyDocument: JSON.stringify(policyDocument),
        })
        .promise();
      console.log("✅ Role policy updated to include permissions.");
    } catch (error) {
      console.error("Error attaching policy:", error);
    }

    // Create and associate instance profile
    try {
      await iamClient
        .createInstanceProfile({
          InstanceProfileName: this.instanceProfileName,
        })
        .promise();
      console.log(`✅ Instance Profile '${this.instanceProfileName}' created.`);
    } catch (error) {
      if (error.code !== "EntityAlreadyExistsException") {
        console.error("Error creating Instance Profile:", error);
      } else {
        console.log(
          `⚠️ Instance Profile '${this.instanceProfileName}' already exists.`
        );
      }
    }

    try {
      await iamClient
        .addRoleToInstanceProfile({
          InstanceProfileName: this.instanceProfileName,
          RoleName: this.iamRoleName,
        })
        .promise();
      console.log(
        `✅ IAM Role '${this.iamRoleName}' added to Instance Profile.`
      );
    } catch (error) {
      console.error("Error attaching IAM Role to Instance Profile:", error);
    }
  }

  async createKeyPair() {
    const ec2Client = this.awsService;
    try {
      const response = await ec2Client
        .createKeyPair({ KeyName: this.keyName })
        .promise();
      require("fs").writeFileSync(`${this.keyName}.pem`, response.KeyMaterial);
      console.log(`✅ Key pair '${this.keyName}' created and saved.`);
    } catch (error) {
      if (error.code !== "InvalidKeyPair.Duplicate") {
        console.error("Error creating Key Pair:", error);
      } else {
        console.log(`⚠️ Key pair '${this.keyName}' already exists.`);
      }
    }
  }

  async generateRandomName(length = 8) {
    return this.commonFunctions.generateRandomString(length);
  }

  async createDeployment() {
    const ec2Client = this.awsService;
    const instanceName = await this.generateRandomName();
    const terminationTime = new Date(Date.now() + 5 * 60000).toISOString(); // 5 minutes from now

    console.log(`🕒 Termination Time (UTC): ${terminationTime}`);
    console.log(`🔖 Instance Name: ${instanceName}`);

    const userDataScript = this.generateUserDataScript(
      terminationTime,
      instanceName
    );

    const params = {
      ImageId: this.imageId,
      InstanceType: this.instanceType,
      KeyName: this.keyName,
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: [this.securityGroup],
      IamInstanceProfile: { Name: this.instanceProfileName },
      UserData: Buffer.from(userDataScript).toString("base64"),
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [{ Key: "Name", Value: instanceName }],
        },
      ],
    };

    try {
      const response = await ec2Client.runInstances(params).promise();
      const instanceId = response.Instances[0].InstanceId;
      console.log(`🚀 EC2 Instance '${instanceId}' launched successfully.`);
      return instanceId;
    } catch (error) {
      console.error("Error launching EC2 Instance:", error);
      return null;
    }
  }

  generateUserDataScript(terminationTime, instanceName) {
    return `#!/bin/bash
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
termination_time="${terminationTime}"

while true; do
    current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    log_message "Checking Termination Condition. Current Time: $current_time"

    if [[ "$current_time" > "$termination_time" ]]; then
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
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - AWS CLI not found, installing using snap..." | tee -a $LOG_FILE
    sudo snap install aws-cli --classic
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - AWS CLI installed" | tee -a $LOG_FILE
fi

# Start script in background with nohup
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Starting termination script in background" | tee -a $LOG_FILE
nohup bash $SCRIPT_PATH > /dev/null 2>&1 & 
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Termination script started in background" | tee -a $LOG_FILE
`;
  }
}

// **Exporting the Renamed Class**
module.exports = AwsService;
