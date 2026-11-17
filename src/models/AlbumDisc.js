const mongoose = require("mongoose");

const cropSchema = mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    rx: { type: Number, required: true },
    ry: { type: Number, required: true },
  },
  { _id: false },
);

const albumDiscSchema = mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  discArt: { type: String, default: null },
  crop: { type: cropSchema, default: null },
  checkedAt: { type: Date, required: true },
});

module.exports = mongoose.model("AlbumDisc", albumDiscSchema);
