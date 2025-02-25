const express = require("express");
const { check } = require("express-validator");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { authMiddleware, authorize } = require("../middleware/auth");

const router = express.Router();

// 📌 Lấy tất cả người dùng (Chỉ Admin)
router.get("/", authMiddleware, authorize(["admin"]), getAllUsers);

// 📌 Lấy thông tin người dùng theo ID
router.get("/:id", authMiddleware, getUserById);

// 📌 Tạo người dùng mới (Chỉ Admin)
router.post(
  "/",
  [
    authMiddleware,
    authorize(["admin"]),
    check("username", "Tên người dùng không được để trống").not().isEmpty(),
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Mật khẩu phải có ít nhất 8 ký tự").isLength({ min: 8 }),
  ],
  createUser
);

// 📌 Cập nhật thông tin người dùng
router.put("/:id", authMiddleware, updateUser);

// 📌 Xóa người dùng (Chỉ Admin)
router.delete("/:id", authMiddleware, authorize(["admin"]), deleteUser);

module.exports = router;
