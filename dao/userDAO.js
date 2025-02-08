const userRegister = require("../models/userRegister.js");

class UserDAO {
  // Find a user by their address
  async findUserByAddress(userAddress) {
    return await userRegister.findOne({ userAddress });
  }

  // Find a user by their name
  async findUserByName(name) {
    return await userRegister.findOne({ name });
  }

  // Create a new user
  async createUser(userData) {
    return await userRegister.create(userData);
  }

  // Update the success status of a user
  async updateUserSuccess(id, success) {
    return await userRegister.findByIdAndUpdate(id, { success }, { new: true });
  }
}

module.exports = new UserDAO();
