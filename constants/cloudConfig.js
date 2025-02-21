const cloudConfig = {
  SPHERON: "SPHERON",
  AWS: "AWS",
};

const renameCloudProvider = {
  AWS: "Next-Gen GPU",
  "Next-Gen GPU": "AWS",
  SPHERON: "SPHERON",
};

module.exports = { cloudConfig, renameCloudProvider };
