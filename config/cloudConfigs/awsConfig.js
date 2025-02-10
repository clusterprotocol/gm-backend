require("dotenv").config();
const AWS = require("aws-sdk");

// Load AWS Credentials from .env
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
};

// Initialize AWS EC2 Client
const awsEc2 = new AWS.EC2(awsConfig);

// Export the configured AWS SDK instance
module.exports = awsEc2;
