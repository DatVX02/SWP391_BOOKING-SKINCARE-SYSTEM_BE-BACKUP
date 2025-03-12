const Rating = require("../models/Rating");
const Product = require("../models/Product");
const User = require("../models/User");

exports.createRating = async (req, res) => {
  try {
    const { serviceID, serviceRating, serviceContent, images, createName } =
      req.body;

    // Lấy tên sản phẩm từ Product
    const product = await Product.findOne({ service_id: serviceID });
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Lấy tên người dùng từ User
    const user = await User.findOne({ username: createName });

    if (!user) return res.status(404).json({ error: "User not found" });

    const newRating = new Rating({
      serviceID,
      serviceName: product.name, // Lấy từ Product
      serviceRating,
      serviceContent,
      images,
      createName: user.username, // Lấy từ User
    });

    await newRating.save();
    res.status(201).json(newRating);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRatings = async (req, res) => {
  try {
    const ratings = await Rating.find();
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRatingById = async (req, res) => {
  try {
    const { id } = req.params;

    const rating = await Rating.findById(id);
    if (!rating) return res.status(404).json({ error: "Rating not found" });

    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRatingsByServiceName = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const ratings = await Rating.find({ serviceName });

    if (ratings.length === 0) {
      return res
        .status(404)
        .json({ error: "No ratings found for this service" });
    }

    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceRating, serviceContent, images } = req.body;

    const rating = await Rating.findById(id);
    if (!rating) return res.status(404).json({ error: "Rating not found" });

    // Cập nhật thông tin đánh giá
    rating.serviceRating = serviceRating || rating.serviceRating;
    rating.serviceContent = serviceContent || rating.serviceContent;
    rating.images = images || rating.images;

    await rating.save();
    res.json({ message: "Rating updated successfully", rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    const rating = await Rating.findById(id);
    if (!rating) return res.status(404).json({ error: "Rating not found" });

    await Rating.findByIdAndDelete(id);
    res.json({ message: "Rating deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
