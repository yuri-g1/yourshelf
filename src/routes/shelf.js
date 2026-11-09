const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Relationship = require("../models/Relationship");
const identifyUser = require("../middlewares/IdentifyUser");

const router = express.Router();

function pickMovieFields(body) {
  return {
    externalId: body?.externalId,
    title: body?.title,
    desc: body?.desc,
  };
}

function isOwner(req) {
  return String(req.user._id) === req.params.id;
}

router.get("/shelf/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const user = await User.findById(req.params.id).populate(
    "shelf.movies.recommendedBy",
    "name",
  );

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const movies = user.shelf?.movies ?? [];

  return res.json({
    owner: { _id: user._id, name: user.name },
    myShelf: movies.filter((movie) => !movie.recommendedBy),
    recommended: movies.filter((movie) => movie.recommendedBy),
  });
});

router.post("/shelf/:id/movie", identifyUser, async (req, res) => {
  if (!isOwner(req)) {
    return res
      .status(403)
      .json({ error: "You can only add movies to your own shelf" });
  }

  const user = req.user;
  if (!user.shelf) user.shelf = {};

  user.shelf.movies.push(pickMovieFields(req.body));
  await user.save();

  return res.status(201).json(user.shelf.movies.at(-1));
});

router.delete("/shelf/:id/movie/:movieId", identifyUser, async (req, res) => {
  if (!isOwner(req)) {
    return res
      .status(403)
      .json({ error: "You can only remove movies from your own shelf" });
  }

  if (!mongoose.isValidObjectId(req.params.movieId)) {
    return res.status(400).json({ error: "Invalid movie id" });
  }

  const movie = req.user.shelf?.movies.id(req.params.movieId);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found on this shelf" });
  }

  movie.deleteOne();
  await req.user.save();

  return res.status(204).end();
});

router.post("/recommend/shelf/:id/movie", identifyUser, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (isOwner(req)) {
    return res.status(400).json({
      error: "You cannot recommend to yourself, use POST /shelf/:id/movie",
    });
  }

  const owner = await User.findById(req.params.id);

  if (!owner) {
    return res.status(404).json({ error: "User not found" });
  }

  const relation = await Relationship.findBetween(req.user._id, owner._id);

  if (relation?.status !== "accepted") {
    return res
      .status(403)
      .json({ error: "Only friends can recommend movies" });
  }

  if (!owner.shelf) owner.shelf = {};

  owner.shelf.movies.push({
    ...pickMovieFields(req.body),
    recommendationText: req.body?.recommendationText,
    recommendedBy: req.user._id,
  });
  await owner.save();

  return res.status(201).json(owner.shelf.movies.at(-1));
});

module.exports = router;
