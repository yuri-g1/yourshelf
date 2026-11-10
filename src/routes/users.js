const express = require("express");
const User = require("../models/User");
const { identifyUser } = require("../middlewares/IdentifyUser");
const { writeLimit } = require("../middlewares/rateLimiting");

const router = express.Router();

function visibilityOf(user) {
  return user.shelf?.visibility ?? "public";
}

const PREVIEW_SIZE = 4;

function previewOf(user) {
  const movies = user.shelf?.movies ?? [];

  return {
    picks: movies.filter((movie) => !movie.recommendedBy).length,
    recommended: movies.filter((movie) => movie.recommendedBy).length,
    posters: movies
      .slice(-PREVIEW_SIZE)
      .reverse()
      .map((movie) => ({ title: movie.title, posterPath: movie.posterPath || null })),
  };
}

router.get("/users", async (req, res) => {
  const users = await User.find()
    .select("name shelf.visibility shelf.movies.title shelf.movies.posterPath shelf.movies.recommendedBy")
    .sort("name");

  return res.json(
    users.map((user) => {
      const visibility = visibilityOf(user);

      return {
        _id: user._id,
        name: user.name,
        visibility,
        preview: visibility === "public" ? previewOf(user) : null,
      };
    }),
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
