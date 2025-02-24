const express = require("express");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();

// Lấy tất cả người dùng (Admin)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

// Lấy thông tin người dùng theo ID
router.get("/:id", async (req, res) => {
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
});

// Cập nhật thông tin người dùng
router.put("/:id", async (req, res) => {
  const { username, email, role, phone, gender, avatar } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "ID không hợp lệ" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "Người dùng không tìm thấy" });
    }

    let updated = false;
    if (username && username !== user.username) {
      user.username = username;
      updated = true;
    }

    if (email && email !== user.email) {
      user.email = email;
      updated = true;
    }

    if (role && role !== user.role) {
      user.role = role;
      updated = true;
    }

    if (phone && phone !== user.phone) {
      user.phone = phone;
      updated = true;
    }

    if (gender && gender !== user.gender) {
      user.gender = gender;
      updated = true;
    }

    if (avatar && avatar !== user.avatar) {
      user.avatar = avatar;
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ msg: "Không có thay đổi nào để cập nhật" });
    }

    await user.save();
    res.json({ msg: "Cập nhật thành công", user });
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).send("Lỗi máy chủ");
  }
});

// Xóa người dùng (Admin)
router.delete("/:id", async (req, res) => {
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
    console.error("Lỗi xóa người dùng:", err);
    res.status(500).send("Lỗi máy chủ, vui lòng thử lại sau.");
  }
});

module.exports = router;
