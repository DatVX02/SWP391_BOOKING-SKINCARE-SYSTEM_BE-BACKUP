const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["user", "admin", "moderator", "manager", "staff"],
      default: "user",
    },
    otp: { type: String }, // Lưu mã OTP
    otpExpires: { type: Date }, // Thời gian hết hạn OTP
    isVerified: { type: Boolean, default: false }, // Xác thực email hay chưa
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
