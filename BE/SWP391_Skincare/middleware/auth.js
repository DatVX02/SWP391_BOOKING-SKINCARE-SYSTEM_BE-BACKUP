const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ msg: "Không có token, truy cập bị từ chối" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token không hợp lệ hoặc đã hết hạn" });
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

module.exports = { authMiddleware, authorize };
