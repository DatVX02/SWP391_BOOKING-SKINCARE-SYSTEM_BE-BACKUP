const express = require("express");
const { check, validationResult } = require("express-validator");
const Product = require("../models/Product");
const Category = require("../models/Category");

const router = express.Router();

router.post(
  "/",
  [
    check("name", "Tên sản phẩm không được để trống").not().isEmpty(),
    check("price", "Giá sản phẩm phải là số hợp lệ").matches(
      /^\d{1,3}(\.\d{3})*$/
    ), // Regex kiểm tra định dạng 100.000
    check("duration", "Thời gian phải là số nguyên").isInt(),
    check("category", "ID danh mục không hợp lệ").isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { name, description, price, duration, category, image } = req.body;

    // Kiểm tra và xử lý giá tiền
    if (typeof price === "string") {
      price = price.replace(/\./g, ""); // Loại bỏ dấu chấm nếu giá là chuỗi
    } else if (typeof price === "number") {
      price = price.toString(); // Chuyển số thành chuỗi để đồng nhất
    } else {
      return res.status(400).json({ msg: "Giá sản phẩm không hợp lệ" });
    }

    try {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ msg: "Danh mục không tồn tại" });
      }

      const lastProduct = await Product.findOne().sort({ service_id: -1 });
      const newServiceId = lastProduct ? lastProduct.service_id + 1 : 1;

      const product = new Product({
        service_id: newServiceId,
        name,
        description,
        price,
        duration,
        category,
        image: image || "",
      });

      await product.save();
      res.status(201).json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate(
      "category",
      "name description"
    );
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name description"
    );
    if (!product) {
      return res.status(404).json({ msg: "Sản phẩm không tồn tại" });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});
router.put("/:id", async (req, res) => {
  const { name, description, price, duration, category, image } = req.body;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Sản phẩm không tồn tại" });
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ msg: "Danh mục không tồn tại" });
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.duration = duration || product.duration;
    product.category = category || product.category;
    product.image = image || product.image;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Sản phẩm đã được xóa" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

module.exports = router;
