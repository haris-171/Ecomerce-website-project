const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
