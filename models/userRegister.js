const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0, required: true, min: 0 }, // Ensures balance is non-negative
  currency: { type: String, default: "USD", required: true, uppercase: true }, // Forces uppercase currency codes (e.g., USD, EUR)
});

const userRegisterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Ensures name is required & trimmed
    userAddress: { type: String, required: true, unique: true, trim: true }, // Enforces unique addresses
    sshKey: { type: String }, // SSH key is required
    success: { type: Boolean, default: false },
    wallet: { type: walletSchema, default: () => ({}) }, // Ensures wallet is always initialized
  },
  { collection: "userRegister", versionKey: false, timestamps: true }
);

const UserRegister = mongoose.model("UserRegister", userRegisterSchema);

module.exports = UserRegister;
