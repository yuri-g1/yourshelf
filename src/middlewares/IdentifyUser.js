const mongoose = require("mongoose");
const User = require("../models/User");

async function identifyUser(req, res, next) {
  const userId = req.get("X-User-Id");

  if (!userId) {
    return res.status(401).json({ error: "Missing X-User-Id header" });
  }

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ error: "Invalid X-User-Id" });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = user;
  next();
}

module.exports = identifyUser;
