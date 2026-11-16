const mongoose = require("mongoose");

const trendingItemSchema = mongoose.Schema(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    posterPath: String,
    creator: String,
    desc: String,
    count: { type: Number, required: true },
  },
  { _id: false },
);

const trendingSchema = mongoose.Schema({
  key: { type: String, required: true, unique: true },
  computedAt: { type: Date, required: true },
  windowStart: { type: Date, required: true },
  windowEnd: { type: Date, required: true },
  top: {
    movie: [trendingItemSchema],
    game: [trendingItemSchema],
    book: [trendingItemSchema],
    album: [trendingItemSchema],
  },
});

module.exports = mongoose.model("Trending", trendingSchema);
