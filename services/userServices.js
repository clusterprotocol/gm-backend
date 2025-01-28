const jwt = require("jsonwebtoken");
const {
  findUserByAddress,
  findUserByName,
  createUser,
  updateUserSuccess,
} = require("../dao/userDAO.js");

const generateToken = (userAddress) => {
  return jwt.sign({ userAddress }, process.env.JWTSECRET, {});
};

const isUserService = async (userAddress) => {
  const user = await findUserByAddress(userAddress);
  if (user) {
    const token = generateToken(user.userAddress);
    return { userBool: true, user, token };
  }
  return { userBool: false };
};

const userNameStatusService = async (userName) => {
  const user = await findUserByName(userName);
  return { isTaken: !!user };
};

const registerUserService = async (name, userAddress, sshKey) => {
  const existingUser = await findUserByAddress(userAddress);
  if (existingUser) {
    const token = generateToken(existingUser.userAddress);
    return {
      success: true,
      user: existingUser,
      token,
      message: "User already exists",
    };
  }

  const newUser = await createUser({
    name,
    userAddress,
    sshKey,
    success: true,
  });
  const token = generateToken(newUser.userAddress);
  return {
    success: true,
    user: newUser,
    token,
    message: "User registered successfully",
  };
};

const getUsernameService = async (userAddress) => {
  const user = await findUserByAddress(userAddress);
  return { username: user?.name || null };
};

module.exports = {
  isUserService,
  userNameStatusService,
  registerUserService,
  getUsernameService,
};
