const mongoose = require("mongoose");

function itemSchema({ id, poster }) {
  return mongoose.Schema({
    externalId: { type: String, maxLength: 100, match: id },
    title: { type: String, required: true, maxLength: 100 },
    desc: { type: String, maxLength: 500 },
    posterPath: { type: String, maxLength: 100, match: poster },
    creator: { type: String, maxLength: 100 },
    recommendationText: { type: String, maxLength: 500 },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  });
}

const shelfSchema = mongoose.Schema({
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  movies: [itemSchema({ id: /^\d+$/, poster: /^\/[\w-]+\.(jpg|jpeg|png)$/ })],
  games: [itemSchema({ id: /^\d+$/, poster: /^[a-z0-9]{1,40}$/ })],
  books: [itemSchema({ id: /^OL\d+W$/, poster: /^\d{1,12}$/ })],
  albums: [itemSchema({ id: /^\d+$/, poster: /^[a-f0-9]{32}$/ })],
});

module.exports = shelfSchema;
