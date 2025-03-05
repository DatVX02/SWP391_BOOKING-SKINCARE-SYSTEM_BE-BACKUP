const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "Không có token, truy cập bị từ chối" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    // 🔥 Kiểm tra token trong DB có khớp không (Tránh trường hợp dùng token cũ)
    if (!user || user.token !== token) {
      return res
        .status(401)
        .json({ msg: "Token không hợp lệ hoặc đã đăng xuất" });
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token không hợp lệ" });
  }
};

module.exports = { authMiddleware };

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Bạn không có quyền truy cập" });
    }
    next();
  };
};

module.exports = { authMiddleware, authorize };
