const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone_number: { type: String },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "other",
    },
    address: { type: String },
    role: {
      type: String,
      enum: ["user", "admin", "skincare_staff", "manager", "staff"],
      default: "user",
    },
    avatar: { type: String, default: "default-avatar.png" },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
