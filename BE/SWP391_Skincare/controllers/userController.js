const mongoose = require("mongoose");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");

// ✅ Lấy tất cả người dùng (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
};

// ✅ Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tìm thấy" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
};

// ✅ Tạo người dùng mới (Chỉ Admin)
const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    username,
    email,
    password,
    role,
    phone_number,
    gender,
    address,
    avatar,
  } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "Email đã được sử dụng" });
    }

    const newUser = new User({
      username,
      email,
      password,
      role: role || "user",
      isVerified: false,
      phone_number,
      gender,
      address,
      avatar: avatar || "default-avatar.png",
    });

    await newUser.save();
    res.status(201).json({ msg: "Tài khoản đã được tạo", user: newUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
};

// ✅ Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  const { username, email, role, phone_number, gender, avatar } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "ID không hợp lệ" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tìm thấy" });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone_number) user.phone_number = phone_number;
    if (gender) user.gender = gender;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ msg: "Cập nhật thành công", user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
};

// ✅ Xóa người dùng (Chỉ Admin)
const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "ID không hợp lệ" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tìm thấy" });
    }

    res.json({ msg: "Người dùng đã được xóa" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
};

// ✅ Xuất các hàm
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
