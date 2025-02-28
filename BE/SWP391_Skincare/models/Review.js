const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    reviewID: { type: Number, unique: true }, // Thêm reviewID riêng biệt
    reviewName: { type: String, required: true },
    reviewContent: { type: String, required: true },
    serviceId: { type: Number, required: true },
    serviceName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Tự động tăng reviewID trước khi lưu
ReviewSchema.pre("save", async function (next) {
  if (!this.reviewID) {
    const lastReview = await this.constructor.findOne().sort({ reviewID: -1 });
    this.reviewID = lastReview ? lastReview.reviewID + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Review", ReviewSchema);
