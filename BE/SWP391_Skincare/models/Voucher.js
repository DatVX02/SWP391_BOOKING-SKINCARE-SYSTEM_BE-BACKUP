const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountPercentage: { type: Number, required: true }, // Giảm giá theo %
    expiryDate: { type: Date, required: true }, // Ngày hết hạn
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);
