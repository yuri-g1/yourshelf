const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Relationship = require("../models/Relationship");
const { identifyUser, optionalUser } = require("../middlewares/IdentifyUser");
const { writeLimit } = require("../middlewares/rateLimiting");
const { catalogs, catalogFor, withLiveData, withDetails } = require("../lib/catalogs");

const router = express.Router();

const SHELF_LIMIT = 100;

function pickItemFields(body) {
  return {
    externalId: body?.externalId || undefined,
    title: body?.title,
    desc: body?.desc,
    posterPath: body?.posterPath || undefined,
    creator: body?.creator || undefined,
  };
}

function isOwner(req) {
  return String(req.user._id) === req.params.id;
}

function requireCatalog(req, res, next) {
  req.catalog = catalogFor(req.params.kind);

  if (!req.catalog) {
    return res.status(404).json({ error: "Unknown shelf type" });
  }

  next();
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
    Object.values(catalogs).map((catalog) => ({
      path: `shelf.${catalog.field}.recommendedBy`,
      select: "name",
    })),
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

  const body = { owner: { _id: user._id, name: user.name }, visibility };

  await Promise.all(
    Object.entries(catalogs).map(async ([kind, catalog]) => {
      const items = await withLiveData(catalog, user.shelf?.[catalog.field] ?? []);

      body[kind] = {
        myShelf: items.filter((item) => !item.recommendedBy),
        recommended: items.filter((item) => item.recommendedBy),
      };
    }),
  );

  return res.json(body);
});

router.post("/shelf/:id/:kind", identifyUser, writeLimit, requireCatalog, async (req, res) => {
  const { field, plural } = req.catalog;

  if (!isOwner(req)) {
    return res.status(403).json({ error: `You can only add ${plural} to your own shelf` });
  }

  const user = req.user;
  if (!user.shelf) user.shelf = {};

  if (user.shelf[field].length >= SHELF_LIMIT) {
    return res.status(422).json({
      error: `You have already used all the spaces for ${plural} available`,
    });
  }

  user.shelf[field].push(await withDetails(req.catalog, pickItemFields(req.body)));
  await user.save();

  return res.status(201).json(user.shelf[field].at(-1));
});

router.delete("/shelf/:id/:kind/:itemId", identifyUser, writeLimit, requireCatalog, async (req, res) => {
  const { field, noun, plural } = req.catalog;

  if (!isOwner(req)) {
    return res.status(403).json({ error: `You can only remove ${plural} from your own shelf` });
  }

  if (!mongoose.isValidObjectId(req.params.itemId)) {
    return res.status(400).json({ error: `Invalid ${noun} id` });
  }

  const item = req.user.shelf?.[field].id(req.params.itemId);

  if (!item) {
    return res.status(404).json({ error: `That ${noun} is not on this shelf` });
  }

  item.deleteOne();
  await req.user.save();

  return res.status(204).end();
});

router.post("/recommend/shelf/:id/:kind", identifyUser, writeLimit, requireCatalog, async (req, res) => {
  const { field, plural } = req.catalog;

  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (isOwner(req)) {
    return res.status(400).json({
      error: `You cannot recommend to yourself, use POST /shelf/:id/${req.params.kind}`,
    });
  }

  const owner = await User.findById(req.params.id);

  if (!owner) {
    return res.status(404).json({ error: "User not found" });
  }

  const relation = await Relationship.findBetween(req.user._id, owner._id);

  if (relation?.status !== "accepted") {
    return res.status(403).json({ error: `Only friends can recommend ${plural}` });
  }

  if (!owner.shelf) owner.shelf = {};

  if (owner.shelf[field].length >= SHELF_LIMIT) {
    return res.status(422).json({
      error: `This friend has no space left for ${plural}`,
    });
  }

  owner.shelf[field].push({
    ...(await withDetails(req.catalog, pickItemFields(req.body))),
    recommendationText: req.body?.recommendationText,
    recommendedBy: req.user._id,
  });
  await owner.save();

  return res.status(201).json(owner.shelf[field].at(-1));
});

module.exports = router;
