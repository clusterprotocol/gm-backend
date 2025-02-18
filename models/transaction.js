const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userAddress: String,
    amount: Number,
    deploymentId: String,
    txHash: String,
    approvedHash: String,
    message: String,
    preiousBalance: Number,
    finalBalance: Number,
    deductionCost: {
      type: Object,
      default: {
        totalCost: 0,
        fromWallet: 0,
        fromAccount: 0,
        tokenAddress: "",
        refund: 0,
      },
    },
    type: { type: String, enum: ["credit", "debit"] },
    currency: { type: String, default: "USD" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "transactions", versionKey: false, timestamps: true }
);

const Transaction = mongoose.model("transactions", transactionSchema);
module.exports = Transaction;
