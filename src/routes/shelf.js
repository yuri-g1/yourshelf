const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Relationship = require("../models/Relationship");
const { identifyUser, optionalUser } = require("../middlewares/IdentifyUser");
const { writeLimit } = require("../middlewares/rateLimiting");

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

async function canView(viewer, owner) {
  if ((owner.shelf?.visibility ?? "public") === "public") return true;
  if (!viewer) return false;
  if (viewer._id.equals(owner._id)) return true;

  const relation = await Relationship.findBetween(viewer._id, owner._id);
  return relation?.status === "accepted";
}

router.get("/shelf/:id", optionalUser, async (req, res) => {
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

  const visibility = user.shelf?.visibility ?? "public";

  if (!(await canView(req.user, user))) {
    return res.status(403).json({
      error: "This shelf is private",
      owner: { _id: user._id, name: user.name },
      visibility,
    });
  }

  const movies = user.shelf?.movies ?? [];

  return res.json({
    owner: { _id: user._id, name: user.name },
    visibility,
    myShelf: movies.filter((movie) => !movie.recommendedBy),
    recommended: movies.filter((movie) => movie.recommendedBy),
  });
});

router.post("/shelf/:id/movie", identifyUser, writeLimit, async (req, res) => {
  if (!isOwner(req)) {
    return res
      .status(403)
      .json({ error: "You can only add movies to your own shelf" });
  }

  const user = req.user;
  if (!user.shelf) user.shelf = {};

  if (user.shelf.movies.length >= 100) {
    return res.status(422).json({
      error: "You have already used all the spaces for movies available",
    });
  }

  user.shelf.movies.push(pickMovieFields(req.body));
  await user.save();

  return res.status(201).json(user.shelf.movies.at(-1));
});

router.delete("/shelf/:id/movie/:movieId", identifyUser, writeLimit, async (req, res) => {
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

router.post("/recommend/shelf/:id/movie", identifyUser, writeLimit, async (req, res) => {
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
    return res.status(403).json({ error: "Only friends can recommend movies" });
  }

  if (!owner.shelf) owner.shelf = {};

  if (owner.shelf.movies.length >= 100) {
    return res.status(422).json({
      error:
        "This friend has a full shelf, he can't receive any more recommendations",
    });
  }

  owner.shelf.movies.push({
    ...pickMovieFields(req.body),
    recommendationText: req.body?.recommendationText,
    recommendedBy: req.user._id,
  });
  await owner.save();

  return res.status(201).json(owner.shelf.movies.at(-1));
});

module.exports = router;
