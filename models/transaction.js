const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userAddress: String,
    amount: Number,
    deploymentId: String,
    preiousBalance: Number,
    finalBalance: Number,
    type: { type: String, enum: ["credit", "debit"] },
    currency: { type: String, default: "USD" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "transactions", versionKey: false, timestamps: true }
);

const Transaction = mongoose.model("transactions", transactionSchema);
module.exports = Transaction;
