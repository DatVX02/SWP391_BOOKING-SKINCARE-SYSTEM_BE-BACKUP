const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// Định nghĩa các route
router.post("/", cartController.createCart);
router.get("/", cartController.getAllCarts);
router.get("/:cartID", cartController.getCartById);
router.get("/user/:username", cartController.getCartsByUsername);
router.put("/:cartID", cartController.updateCart);
router.delete("/:cartID", cartController.deleteCart);
router.put("/:cartID/cancel", cartController.cancelCart); // 🔥 API Hủy Giỏ Hàng

module.exports = router;
