const express = require("express");
const { check, validationResult } = require("express-validator");
const Review = require("../models/Review");
const Product = require("../models/Product");

const router = express.Router();

// API: Tạo review mới
router.post(
  "/",
  [
    check("reviewName", "Tên người review không được để trống").not().isEmpty(),
    check("reviewContent", "Nội dung review không được để trống")
      .not()
      .isEmpty(),
    check("serviceId", "serviceId phải là số").isNumeric(),
    check("rating", "Rating phải từ 1 đến 5").isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewName, reviewContent, serviceId, rating, images } = req.body;

    try {
      const product = await Product.findOne({ service_id: serviceId });

      if (!product) {
        return res.status(404).json({ msg: "Dịch vụ không tồn tại" });
      }

      const newReview = new Review({
        reviewName,
        reviewContent,
        serviceId,
        serviceName: product.name,
        rating,
        images: images || [],
      });

      await newReview.save();
      res.status(201).json(newReview);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Lỗi máy chủ");
    }
  }
);

// API: Lấy danh sách review
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

// API: Lấy review theo ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: "Review không tồn tại" });
    }
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

// API: Cập nhật review
router.put("/:reviewID", async (req, res) => {
  const { reviewName, reviewContent, rating, images } = req.body;
  let { reviewID } = req.params;

  // Chuyển đổi reviewID sang Number
  reviewID = Number(reviewID);

  // Kiểm tra nếu reviewID không hợp lệ
  if (isNaN(reviewID)) {
    return res.status(400).json({ msg: "reviewID không hợp lệ" });
  }

  try {
    let review = await Review.findOne({ reviewID });

    if (!review) {
      return res.status(404).json({ msg: "Review không tồn tại" });
    }

    // Cập nhật dữ liệu
    review.reviewName = reviewName || review.reviewName;
    review.reviewContent = reviewContent || review.reviewContent;
    review.rating = rating || review.rating;
    review.images = images || review.images;

    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

// API: Xóa review
router.delete("/:id", async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ msg: "Review đã được xóa" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Lỗi máy chủ");
  }
});

module.exports = router;
