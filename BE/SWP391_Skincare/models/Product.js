const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    service_id: { type: Number, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, 
    duration: { type: Number, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: { type: String, default: "" },
    createDate: { type: Date, default: Date.now },
    updateDate: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ProductSchema.pre("save", function (next) {
  this.updateDate = new Date();
  next();
});

module.exports = mongoose.model("Product", ProductSchema);
