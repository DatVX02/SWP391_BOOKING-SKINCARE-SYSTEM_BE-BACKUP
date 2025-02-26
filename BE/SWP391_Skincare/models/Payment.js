const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true },
  orderName: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["pending", "success", "failed", "cancelled"],
    default: "pending",
  },
  returnUrl: { type: String },
  cancelUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
