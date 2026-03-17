const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 4.5 },
    badge: { type: String, default: "" },
    tagline: { type: String, default: "" },
    image: { type: String, required: true },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
