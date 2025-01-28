const RegisterMachine = require("../models/registerMachine.js");
const Order = require("../models/order.js");

const saveNewMachine = async (machineData) => {
  const newMachine = new RegisterMachine(machineData);
  return newMachine.save();
};

const saveNewOrder = async (orderData) => {
  const newOrder = new Order(orderData);
  return newOrder.save();
};

const findOrderByOrderId = async (orderId) => {
  return Order.findOne({ orderId });
};

module.exports = {
  saveNewMachine,
  saveNewOrder,
  findOrderByOrderId,
};
