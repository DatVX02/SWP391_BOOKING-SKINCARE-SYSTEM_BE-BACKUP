const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  serviceID: { type: String, required: true },
  serviceName: { type: String, required: true },
  serviceRating: { type: Number, required: true, min: 1, max: 5 },
  serviceContent: { type: String, required: true },
  images: [String],
  createAt: { type: Date, default: Date.now },
  createName: { type: String, required: true },
});

module.exports = mongoose.model("Rating", ratingSchema);
