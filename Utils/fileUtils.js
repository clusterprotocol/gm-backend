const fs = require("fs");
const path = require("path");

const readGpuYml = () => {
  const filePath = path.resolve(__dirname, "../savedFiles/gpu.yml");

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      message: "Deployment failed. The specified YAML file does not exist.",
      error: `File not found: ${filePath}`,
    };
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");

  return fileContent;
};

module.exports = { readGpuYml };
