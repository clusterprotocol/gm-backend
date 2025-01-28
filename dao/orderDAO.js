const userRegister = require("../models/userRegister.js");

const findUserByAddress = async (userAddress) => {
  return await userRegister.findOne({ userAddress });
};

const findUserByName = async (name) => {
  return await userRegister.findOne({ name });
};

const createUser = async (userData) => {
  return await userRegister.create(userData);
};

const updateUserSuccess = async (id, success) => {
  return await userRegister.findByIdAndUpdate(id, { success }, { new: true });
};

module.exports = {
  findUserByAddress,
  findUserByName,
  createUser,
  updateUserSuccess,
};
