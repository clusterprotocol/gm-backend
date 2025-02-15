const jwt = require("jsonwebtoken");
const UserDAO = require("../dao/userDAO");

class UserService {
  constructor() {
    this.jwtSecret = process.env.JWTSECRET;
  }

  // Generate JWT token for a user address
  generateToken(userAddress) {
    return jwt.sign({ userAddress }, this.jwtSecret, {});
  }

  // Check if the user exists and return relevant info
  async isUser(userAddress) {
    const user = await UserDAO.findUserByAddress(userAddress);
    if (user) {
      const token = this.generateToken(user.userAddress);
      return { userBool: true, user, token };
    }
    return { userBool: false };
  }

  // Check if the username is already taken
  async userNameStatus(userName) {
    const user = await UserDAO.findUserByName(userName);
    return { isTaken: !!user };
  }

  // Register a new user if they don't already exist
  async registerUser(name, userAddress, sshKey) {
    const existingUser = await UserDAO.findUserByAddress(userAddress);
    if (existingUser) {
      const token = this.generateToken(existingUser.userAddress);
      return {
        success: true,
        user: existingUser,
        token,
        message: "User already exists",
      };
    }

    const newUser = await UserDAO.createUser({
      name,
      userAddress,
      sshKey,
      success: true,
    });
    const token = this.generateToken(newUser.userAddress);
    return {
      success: true,
      user: newUser,
      token,
      message: "User registered successfully",
    };
  }

  // Retrieve the username associated with a user address
  async getUsername(userAddress) {
    const user = await UserDAO.findUserByAddress(userAddress);
    return { username: user?.name || null };
  }

  // Retrieve the username associated with a user address
  async getUseAddress(userAddress) {
    const user = await UserDAO.findUserByAddress(userAddress);
    return { userAddress: user?.userAddress || null };
  }

  async getUsdBalance(userAddress) {
    const user = await UserDAO.findUserByAddress(userAddress);
    return { success: true, wallet: user.wallet };
  }
}

module.exports = new UserService();
