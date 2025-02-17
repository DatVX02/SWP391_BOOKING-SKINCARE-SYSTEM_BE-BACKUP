const express = require("express");
const { check, validationResult } = require("express-validator");
const Category = require("../models/Category");

const router = express.Router();

router.post(
  "/",
  [check("name", "Tên danh mục không được để trống").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    try {
      let category = await Category.findOne({ name });
      if (category) {
        return res.status(400).json({ msg: "Danh mục đã tồn tại" });
      }

      category = new Category({ name, description });
      await category.save();

      res.status(201).json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Danh mục không tồn tại" });
    }
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

router.put(
  "/:id",
  [
    check("name", "Tên danh mục không được để trống")
      .optional()
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    try {
      let category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ msg: "Danh mục không tồn tại" });
      }

      category.name = name || category.name;
      category.description = description || category.description;
      category.updatedAt = new Date();

      await category.save();
      res.json(category);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: "Danh mục không tồn tại" });
    }

    await category.deleteOne();
    res.json({ msg: "Danh mục đã được xóa" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

module.exports = router;
