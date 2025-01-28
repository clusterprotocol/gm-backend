const {
  isUserService,
  userNameStatusService,
  registerUserService,
  getUsernameService,
} = require("../services/userServices.js");

const {
  getUsdBalanceService,
  getUsdAddsService,
  getUsdSpendsService,
  getOrdersService,
} = require("../services/contractServices.js");

const isUser = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await isUserService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const userNameStatus = async (req, res) => {
  try {
    const { userName } = req.body;
    const response = await userNameStatusService(userName);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUsername = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await getUsernameService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const register = async (req, res) => {
  try {
    const { name, userAddress, sshKey } = req.body;
    const response = await registerUserService(name, userAddress, sshKey);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUsdBalance = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await getUsdBalanceService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUsdAdds = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await getUsdAddsService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUsdSpends = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await getUsdSpendsService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getOrders = async (req, res) => {
  try {
    const { userAddress } = req.body;
    const response = await getOrdersService(userAddress);
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  isUser,
  userNameStatus,
  getUsername,
  register,
  getUsdBalance,
  getUsdAdds,
  getUsdSpends,
  getOrders,
};
