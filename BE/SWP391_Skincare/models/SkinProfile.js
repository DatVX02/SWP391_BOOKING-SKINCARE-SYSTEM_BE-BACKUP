const mongoose = require("mongoose");

const skinProfileSchema = new mongoose.Schema({
  dry: { type: Number, default: 0 },
  oily: { type: Number, default: 0 },
  sensitive: { type: Number, default: 0 },
  aging: { type: Number, default: 0 },
  acne: { type: Number, default: 0 },
});

module.exports = mongoose.model("SkinProfile", skinProfileSchema);
