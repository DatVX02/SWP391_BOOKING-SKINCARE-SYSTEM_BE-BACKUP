const express = require("express");
const router = express.Router();
const Voucher = require("../models/Voucher");

//Tạo voucher mới
router.post("/", async (req, res) => {
  try {
    const { code, discountPercentage, expiryDate } = req.body;

    if (
      !discountPercentage ||
      discountPercentage <= 0 ||
      discountPercentage > 100
    ) {
      return res
        .status(400)
        .json({ message: "Phần trăm giảm giá phải lớn hơn 0 và nhỏ hơn 100" });
    }

    const newVoucher = new Voucher({
      code,
      discountPercentage,
      expiryDate,
    });

    await newVoucher.save();
    res.status(201).json(newVoucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Lấy danh sách tất cả voucher
router.get("/", async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Lấy chi tiết một voucher
router.get("/:id", async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher)
      return res.status(404).json({ message: "Voucher không tồn tại" });
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Cập nhật voucher
router.put("/:id", async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      minOrderValue,
      maxDiscount,
      expiryDate,
      isActive,
    } = req.body;
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      {
        code,
        discountPercentage,
        minOrderValue,
        maxDiscount,
        expiryDate,
        isActive,
      },
      { new: true }
    );
    res.json(updatedVoucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Xóa voucher
router.delete("/:id", async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Kiểm tra & áp dụng voucher
router.post("/apply", async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const voucher = await Voucher.findOne({ code, isActive: true });

    if (!voucher)
      return res
        .status(400)
        .json({ message: "Voucher không hợp lệ hoặc đã hết hạn" });
    if (new Date(voucher.expiryDate) < new Date())
      return res.status(400).json({ message: "Voucher đã hết hạn" });

    let discountAmount = (orderValue * voucher.discountPercentage) / 100;

    res.json({
      success: true,
      discount: discountAmount,
      finalPrice: orderValue - discountAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
