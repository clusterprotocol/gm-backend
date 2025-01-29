const shell = require("shelljs");

const execCommand = (command) => {
  const { code, stdout, stderr } = shell.exec(command, { silent: true });
  if (code !== 0) {
    throw new Error(stderr);
  }
  return stdout;
};

const saveYaml = (fileName, content) => {
  const filePath = `savedFiles/${fileName}`;
  shell.ShellString(content).to(filePath);
};

const extractDeploymentId = (output) => {
  const match = output.match(/lid: (\d+)/);
  return match ? match[1] : null;
};

const parseShellOutput = (output) => {
  try {
    return JSON.parse(output);
  } catch {
    return { raw: output };
  }
};

module.exports = {
  execCommand,
  saveYaml,
  extractDeploymentId,
  parseShellOutput,
};
