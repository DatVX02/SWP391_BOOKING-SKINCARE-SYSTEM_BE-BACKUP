const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

// 🔹 Webhook từ PayOS để cập nhật trạng thái thanh toán
router.post("/", async (req, res) => {
  try {
    const { orderCode, status } = req.body;

    console.log("Received Webhook:", req.body);

    if (!orderCode || !status) {
      return res.status(400).json({
        error: -1,
        message: "Missing required fields",
      });
    }

    // Kiểm tra nếu status hợp lệ
    if (!["pending", "success", "failed", "cancelled"].includes(status)) {
      return res.status(400).json({
        error: -1,
        message: "Invalid status",
      });
    }

    // Cập nhật trạng thái thanh toán
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderCode },
      { status },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        error: -1,
        message: "Order not found",
      });
    }

    return res.json({
      error: 0,
      message: "Payment status updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to update payment status",
    });
  }
});

module.exports = router;
