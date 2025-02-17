const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Đăng ký người dùng (có role)
router.post(
  "/register",
  [
    check("username", "Tên người dùng không được để trống").not().isEmpty(),
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Mật khẩu phải có ít nhất 6 ký tự").isLength({ min: 6 }),
    check("role", "Vai trò không hợp lệ")
      .optional()
      .isIn(["user", "admin", "moderator"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "Email đã được sử dụng" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        username, // Thay đổi từ name -> username
        email,
        password: hashedPassword,
        role: role || "user",
      });

      await user.save();

      res.status(201).json({
        msg: "Đăng ký thành công",
        user: { username, email, role: user.role },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

// Đăng nhập (trả về role)
router.post(
  "/login",
  [
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Vui lòng nhập mật khẩu").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Sai email hoặc mật khẩu" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Sai email hoặc mật khẩu" });
      }

      const payload = {
        user: {
          id: user.id,
          username: user.username, // Trả về username
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({ token, username: user.username, role: user.role });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);


// Middleware xác thực token
const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "Không có token, truy cập bị từ chối" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token không hợp lệ" });
  }
};

// Middleware kiểm tra quyền truy cập
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Bạn không có quyền truy cập" });
    }
    next();
  };
};

// API dành cho Admin
router.get("/admin", authMiddleware, authorize(["admin"]), (req, res) => {
  res.json({ msg: "Chào mừng Admin" });
});

// API dành cho Moderator
router.get(
  "/moderator",
  authMiddleware,
  authorize(["admin", "moderator"]),
  (req, res) => {
    res.json({ msg: "Chào mừng Moderator" });
  }
);

// Lấy thông tin user (yêu cầu token)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ username: user.username, email: user.email, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});


module.exports = router;
