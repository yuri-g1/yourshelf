const express = require("express");
const User = require("../models/User");
const { identifyUser } = require("../middlewares/IdentifyUser");
const { writeLimit } = require("../middlewares/rateLimiting");
const { catalogs } = require("../lib/catalogs");

const router = express.Router();

function visibilityOf(user) {
  return user.shelf?.visibility ?? "public";
}

const PREVIEW_SIZE = 4;

function previewOf(user) {
  const preview = { counts: {}, recommended: 0, posters: [] };
  const added = [];

  for (const [kind, catalog] of Object.entries(catalogs)) {
    const items = user.shelf?.[catalog.field] ?? [];

    preview.counts[kind] = items.length;
    preview.recommended += items.filter((item) => item.recommendedBy).length;
    added.push(...items.map((item) => ({ kind, item })));
  }

  preview.posters = added
    .sort((a, b) => String(b.item._id).localeCompare(String(a.item._id)))
    .slice(0, PREVIEW_SIZE)
    .map(({ kind, item }) => ({ kind, title: item.title, posterPath: item.posterPath || null }));

  return preview;
}

const PREVIEW_FIELDS = Object.values(catalogs)
  .map(({ field }) => `shelf.${field}._id shelf.${field}.title shelf.${field}.posterPath shelf.${field}.recommendedBy`)
  .join(" ");

router.get("/users", async (req, res) => {
  const users = await User.find()
    .select(`name shelf.visibility ${PREVIEW_FIELDS}`)
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
