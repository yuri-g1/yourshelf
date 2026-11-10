const express = require("express");
const User = require("../models/User");
const { identifyUser } = require("../middlewares/IdentifyUser");
const { writeLimit } = require("../middlewares/rateLimiting");

const router = express.Router();

function visibilityOf(user) {
  return user.shelf?.visibility ?? "public";
}

router.get("/users", async (req, res) => {
  const users = await User.find().select("name shelf.visibility").sort("name");

  return res.json(
    users.map((user) => ({
      _id: user._id,
      name: user.name,
      visibility: visibilityOf(user),
    })),
  );
});

router.get("/me", identifyUser, async (req, res) => {
  return res.json({
    _id: req.user._id,
    name: req.user.name,
    visibility: visibilityOf(req.user),
  });
});

router.patch("/me/shelf", identifyUser, writeLimit, async (req, res) => {
  const visibility = req.body?.visibility;

  if (!["public", "private"].includes(visibility)) {
    return res
      .status(400)
      .json({ error: "visibility must be public or private" });
  }

  if (!req.user.shelf) req.user.shelf = {};
  req.user.shelf.visibility = visibility;
  await req.user.save();

  return res.json({ visibility });
});

module.exports = router;
