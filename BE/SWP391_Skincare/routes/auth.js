const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();
const { sendOTP } = require("../utils/email");
const { sendResetPasswordOTP } = require("../utils/email");
const { sendAdminVerificationEmail } = require("../utils/email");
//Đăng ký tài khoản
router.post(
  "/register",
  [
    check("username", "Tên người dùng không được để trống").not().isEmpty(),
    check("email", "Email không hợp lệ").isEmail(),
    check("password", "Mật khẩu phải có ít nhất 8 ký tự").isLength({ min: 8 }),
    check("phone_number", "Số điện thoại không hợp lệ")
      .optional()
      .isMobilePhone(),
    check("gender", "Giới tính không hợp lệ")
      .optional()
      .isIn(["male", "female", "other"]),
    check("address", "Địa chỉ không hợp lệ").optional().isString(),
  ],
  async (req, res) => {
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

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || "user",
        isVerified: false,
        phone_number,
        gender,
        address,
        avatar: avatar || "default-avatar.png",
      });

      await user.save();

      if (["admin", "skincare_staff", "manager", "staff"].includes(role)) {
        const verifyToken = jwt.sign(
          { email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        const verifyLink = `http://localhost:5000/api/auth/auto-verify?token=${verifyToken}`;
        await sendAdminVerificationEmail(email, verifyLink);
      } else {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        await sendOTP(email, otp);
      }

      res
        .status(200)
        .json({
          msg: "Tài khoản đã được tạo. Kiểm tra email để xác thực.",
          email,
        });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

// Xác thực mã OTP
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
      await user.save();

      res.status(200).json({
        msg: "Xác thực thành công, bạn có thể đăng nhập!",
        otp: user.otp, // Luôn trả về OTP sau khi xác thực
        otpExpires: user.otpExpires, // Hiển thị thời gian hết hạn
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

// Đăng nhập tài khoản
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

router.post(
  "/forgot-password",
  [
    check("email", "Email không hợp lệ").isEmail(),
    check("old_password", "Mật khẩu cũ không được để trống").not().isEmpty(),
    check("new_password", "Mật khẩu mới phải có ít nhất 8 ký tự").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const { email, old_password, new_password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: "Email không tồn tại" });
      }

      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Mật khẩu cũ không chính xác" });
      }

      // Băm mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      // Cập nhật mật khẩu mới
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ msg: "Mật khẩu đã được cập nhật thành công" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.post(
  "/forgot-password/send-otp",
  [check("email", "Email không hợp lệ").isEmail()],
  async (req, res) => {
    const { email } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Email không tồn tại" });
      }

      // Tạo mã OTP ngẫu nhiên (6 số)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

      // Lưu OTP vào database
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Gửi OTP Reset Password
      await sendResetPasswordOTP(email, otp);

      res.status(200).json({
        msg: "Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.",
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.post(
  "/forgot-password/reset",
  [
    check("email", "Email không hợp lệ").isEmail(),
    check("otp", "OTP không hợp lệ").isLength({ min: 6, max: 6 }),
    check("new_password", "Mật khẩu mới phải có ít nhất 8 ký tự").isLength({
      min: 8,
    }),
    check("confirm_password", "Xác nhận mật khẩu không khớp").custom(
      (value, { req }) => value === req.body.new_password
    ),
  ],
  async (req, res) => {
    const { email, otp, new_password, confirm_password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: "Email không tồn tại" });
      }

      // Kiểm tra OTP hợp lệ
      if (user.otp !== otp || user.otpExpires < new Date()) {
        return res
          .status(400)
          .json({ msg: "OTP không hợp lệ hoặc đã hết hạn" });
      }

      // Kiểm tra xác nhận mật khẩu mới
      if (new_password !== confirm_password) {
        return res.status(400).json({ msg: "Xác nhận mật khẩu không khớp" });
      }

      // Băm mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      // Cập nhật mật khẩu mới và xóa OTP
      user.password = hashedPassword;
      // user.otp = null;
      // user.otpExpires = null;
      await user.save();

      res.status(200).json({ msg: "Mật khẩu đã được cập nhật thành công" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.get("/auto-verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .json({ msg: "Token không hợp lệ hoặc không được cung cấp" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).json({ msg: "Người dùng không tồn tại" });
    }

    user.isVerified = true;
    await user.save();

    res.redirect("http://localhost:3000/login");
  } catch (err) {
    console.error(err);
    return res.status(400).json({ msg: "Token không hợp lệ hoặc đã hết hạn" });
  }
});


module.exports = router;
