const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getSkincareStaff,
} = require("../controllers/userController");
const { authMiddleware, authorize } = require("../middleware/auth");

const router = express.Router();

// 📌 Lấy danh sách nhân viên có role "skincare_staff" (Đặt LÊN TRƯỚC route `/:id`)
router.get("/skincare-staff", authMiddleware, getSkincareStaff);

// 📌 Lấy tất cả người dùng (Chỉ Admin)
router.get("/", authMiddleware, authorize(["admin"]), getAllUsers);

// 📌 Lấy thông tin người dùng theo ID
router.get("/:id", authMiddleware, getUserById);

// 📌 Tạo người dùng mới (Chỉ Admin)
router.post("/", authMiddleware, authorize(["admin"]), createUser);

// 📌 Cập nhật thông tin người dùng
router.put("/:id", authMiddleware, updateUser);

// 📌 Xóa người dùng (Chỉ Admin)
router.delete("/:id", authMiddleware, authorize(["admin"]), deleteUser);

module.exports = router;
