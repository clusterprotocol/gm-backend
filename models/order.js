const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: Number,
    machineId: Number,
    providerId: String,
    renterId: Number,
    hoursRented: Number,
    revokeTime: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false }
    },
    { collection: 'Order', versionKey: false, timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;