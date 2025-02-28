const express = require("express");
const router = express.Router();
const payOS = require("../utils/payos");
const Payment = require("../models/Payment");

//API tạo link thanh toán
router.post("/create", async (req, res) => {
  const { orderName, description, returnUrl, cancelUrl, amount } = req.body;

  if (
    !orderName ||
    !description ||
    !returnUrl ||
    !cancelUrl ||
    !amount ||
    amount <= 0
  ) {
    return res.status(400).json({
      error: -1,
      message: "Missing or invalid required fields",
    });
  }

  // Giới hạn mô tả tối đa 25 ký tự
  const truncatedDescription =
    description.length > 25 ? description.substring(0, 25) : description;

  const orderCode = Number(String(new Date().getTime()).slice(-6));

  try {
    const paymentLinkRes = await payOS.createPaymentLink({
      orderCode,
      amount,
      description: truncatedDescription, 
      returnUrl,
      cancelUrl,
      orderName,
    });

    return res.json({
      error: 0,
      message: "Success",
      data: {
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode,
        orderCode: paymentLinkRes.orderCode,
        amount: paymentLinkRes.amount,
        description: truncatedDescription, 
      },
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to create payment link",
      data: error.message,
    });
  }
});


// 🔹 API kiểm tra trạng thái thanh toán
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Payment.findOne({ orderCode: req.params.orderId });
    if (!order) {
      return res.status(404).json({
        error: -1,
        message: "Order not found",
        data: null,
      });
    }
    return res.json({
      error: 0,
      message: "Order retrieved",
      data: order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to fetch order",
      data: null,
    });
  }
});

// 🔹 API cập nhật trạng thái thanh toán
router.put("/update/:orderCode", async (req, res) => {
  try {
    const { status } = req.body;
    const { orderCode } = req.params;

    // Kiểm tra nếu status hợp lệ
    if (!["pending", "success", "failed", "cancelled"].includes(status)) {
      return res.status(400).json({
        error: -1,
        message: "Invalid status",
      });
    }

    // Tìm và cập nhật trạng thái thanh toán
    const updatedPayment = await Payment.findOneAndUpdate(
      { orderCode },
      { status },
      { new: true } // Trả về bản ghi mới nhất sau khi cập nhật
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
    console.error("Update Payment Status Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to update payment status",
    });
  }
});

// 🔹 API lấy thông tin tất cả thanh toán
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find();
    return res.json({
      error: 0,
      message: "All payments retrieved",
      data: payments,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to fetch payments",
      data: null,
    });
  }
});

module.exports = router;
