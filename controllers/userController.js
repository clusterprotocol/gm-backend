const UserService = require("../services/userServices.js");
const ContractServices = require("../services/contractServices.js");

class UserController {
  async isUser(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await UserService.isUser(userAddress);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async userNameStatus(req, res) {
    try {
      const { userName } = req.body;
      const response = await UserService.userNameStatus(userName);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getUsername(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await UserService.getUsername(userAddress);
      res.json(response);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async register(req, res) {
    try {
      const { name, userAddress, sshKey } = req.body;

      const response = await UserService.registerUser(
        name,
        userAddress,
        sshKey
      );
      console.log("response resgister ", response);
      res.json(response);
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getUsdBalance(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await UserService.getUsdBalance(userAddress);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getUsdAdds(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await UserService.getUseAddress(userAddress);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getUsdSpends(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await ContractServices.getUsdSpends(userAddress);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getOrders(req, res) {
    try {
      const { userAddress } = req.body;
      const response = await ContractServices.getOrders(userAddress);
      res.json(response);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
}

module.exports = new UserController();
