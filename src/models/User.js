const mongoose = require("mongoose");
const shelfSchema = require("./Shelf");

const userSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  shelf: { type: shelfSchema, default: () => ({}) },
});

module.exports = mongoose.model("User", userSchema);
