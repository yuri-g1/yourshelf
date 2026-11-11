const mongoose = require("mongoose");

function itemSchema(posterPattern) {
  return mongoose.Schema({
    externalId: { type: String, maxLength: 100, match: /^\d+$/ },
    title: { type: String, required: true, maxLength: 100 },
    desc: { type: String, maxLength: 500 },
    posterPath: { type: String, maxLength: 100, match: posterPattern },
    recommendationText: { type: String, maxLength: 500 },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  });
}

const shelfSchema = mongoose.Schema({
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  movies: [itemSchema(/^\/[\w-]+\.(jpg|jpeg|png)$/)],
  games: [itemSchema(/^[a-z0-9]{1,40}$/)],
});

module.exports = shelfSchema;
