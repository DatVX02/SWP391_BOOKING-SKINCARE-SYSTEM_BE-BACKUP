const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();
const { sendOTP } = require("../utils/email");
router.post(
  "/register",
  [
    check("username", "Tên người dùng không được để trống").not().isEmpty(),
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Mật khẩu phải có ít nhất 8 ký tự").isLength({ min: 8 }),
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

      // Băm mật khẩu ngay lập tức
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Tạo mã OTP ngẫu nhiên (6 số)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

      user = new User({
        username,
        email,
        password: hashedPassword, // Lưu mật khẩu đã băm ngay từ đầu
        role: role || "user",
        otp,
        otpExpires,
        isVerified: false, // Chưa kích hoạt tài khoản
      });

      await user.save();
      await sendOTP(email, otp);

      res.status(200).json({
        msg: "Mã OTP đã được gửi đến email. Vui lòng xác thực!",
        email,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);


router.post(
  "/verify-otp",
  [
    check("email", "Email không hợp lệ").isEmail(),
    check("otp", "OTP không hợp lệ").isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    const { email, otp } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user || user.otp !== otp || user.otpExpires < new Date()) {
        return res
          .status(400)
          .json({ msg: "OTP không hợp lệ hoặc đã hết hạn" });
      }

      // Cập nhật trạng thái tài khoản là đã xác thực
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;

      await user.save();

      res
        .status(200)
        .json({ msg: "Xác thực thành công, bạn có thể đăng nhập!" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Vui lòng nhập mật khẩu").exists(),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Sai email hoặc mật khẩu" });
      }

      if (!user.isVerified) {
        return res.status(400).json({ msg: "Email chưa được xác thực!" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Sai email hoặc mật khẩu" });
      }

      const payload = {
        user: {
          id: user.id,
          username: user.username,
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

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Bạn không có quyền truy cập" });
    }
    next();
  };
};

router.get("/admin", authMiddleware, authorize(["admin"]), (req, res) => {
  res.json({ msg: "Chào mừng Admin" });
});

router.get(
  "/moderator",
  authMiddleware,
  authorize(["admin", "moderator"]),
  (req, res) => {
    res.json({ msg: "Chào mừng Moderator" });
  }
);

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
