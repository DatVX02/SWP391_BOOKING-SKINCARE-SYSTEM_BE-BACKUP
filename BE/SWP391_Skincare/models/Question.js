const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      points: {
        dry: { type: Number, default: 0 },
        oily: { type: Number, default: 0 },
        sensitive: { type: Number, default: 0 },
        aging: { type: Number, default: 0 },
        acne: { type: Number, default: 0 },
      },
    },
  ],
});

module.exports = mongoose.model("Question", questionSchema);
