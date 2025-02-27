const express = require("express");
const router = express.Router();
const payOS = require("../utils/payos");
const Payment = require("../models/Payment");

// 🔹 API tạo link thanh toán
router.post("/create", async (req, res) => {
  const { orderName, description, returnUrl, cancelUrl, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: -1, message: "Invalid amount" });
  }

  const orderCode = Number(String(new Date().getTime()).slice(-6));

  try {
    // Lưu vào MongoDB trước khi gửi tới PayOS
    const newPayment = new Payment({
      orderCode,
      orderName,
      description,
      amount,
      returnUrl,
      cancelUrl,
      status: "pending",
    });

    await newPayment.save();

    // Gửi yêu cầu tạo link thanh toán
    const paymentLinkRes = await payOS.createPaymentLink({
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
      orderName,
    });

    return res.json({
      error: 0,
      message: "Success",
      data: {
        bin: paymentLinkRes.bin,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode,
        orderName: orderName,
      },
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      error: -1,
      message: "Failed to create payment link",
      data: null,
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
