const mongoose = require("mongoose");

const moviesSchema = mongoose.Schema({
  externalId: { type: String },
  title: { type: String, required: true },
  desc: { type: String },
  recommendationText: { type: String },
  recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const shelfSchema = mongoose.Schema({
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  movies: [moviesSchema],
});

module.exports = shelfSchema;
