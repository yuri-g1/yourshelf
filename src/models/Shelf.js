const mongoose = require("mongoose");

const moviesSchema = mongoose.Schema({
  externalId: { type: String, maxLength: 100, match: /^\d+$/ },
  title: { type: String, required: true, maxLength: 100 },
  desc: { type: String, maxLength: 500 },
  posterPath: { type: String, maxLength: 100, match: /^\/[\w-]+\.(jpg|jpeg|png)$/ },
  recommendationText: { type: String, maxLength: 500 },
  recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const shelfSchema = mongoose.Schema({
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  movies: [moviesSchema],
});

module.exports = shelfSchema;
