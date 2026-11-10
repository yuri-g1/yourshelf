const mongoose = require("mongoose");
const shelfSchema = require("./Shelf");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9_]{3,20}$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    select: false,
  },
  passwordHash: { type: String, required: true, select: false },
  shelf: { type: shelfSchema, default: () => ({}) },
});

module.exports = mongoose.model("User", userSchema);
