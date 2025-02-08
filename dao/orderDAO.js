const Order = require("../models/order.js");

class OrderDAO {
  async saveNewOrder(orderData) {
    const newOrder = new Order(orderData);
    return newOrder.save();
  }

  async findOrderByOrderId(orderId) {
    return Order.findOne({ orderId });
  }
}

module.exports = new OrderDAO();
