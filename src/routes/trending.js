const express = require("express");
const Trending = require("../models/Trending");
const { weekKey, nextRefreshAt, refreshTrending } = require("../lib/trending");
const { catalogs } = require("../lib/catalogs");

const router = express.Router();
const LEADER_TTL_MS = 6 * 60 * 60 * 1000;
const MISSING_TTL_MS = 2 * 60 * 1000;
const DISC_KINDS = ["movie", "album"];
const leaders = new Map();

async function leaderOf(kind, item) {
  const catalog = catalogs[kind];
  if (!item || !catalog?.isConfigured()) return item;

  try {
    const fresh = (await catalog.getMany([item.externalId])).get(item.externalId);
    if (!fresh) return item;
    return {
      ...item,
      platform: fresh.platform || null,
      discArt: fresh.discArt || null,
      discCrop: fresh.discCrop || null,
    };
  } catch (error) {
    console.error(`${catalog.source} trending lookup failed:`, error.message);
    return item;
  }
}

async function withLeaders(doc) {
  const cached = leaders.get(doc.key);
  if (cached && cached.computedAt === String(doc.computedAt) && Date.now() < cached.expiresAt) return cached.top;

  const entries = await Promise.all(
    Object.entries(doc.top || {}).map(async ([kind, items]) => {
      if (!items?.length) return [kind, items || []];
      return [kind, [await leaderOf(kind, items[0]), ...items.slice(1)]];
    }),
  );
  const top = Object.fromEntries(entries);
  const complete = DISC_KINDS.every((kind) => !top[kind]?.length || top[kind][0].discArt);

  leaders.clear();
  leaders.set(doc.key, {
    computedAt: String(doc.computedAt),
    expiresAt: Date.now() + (complete ? LEADER_TTL_MS : MISSING_TTL_MS),
    top,
  });
  return top;
}

async function present(doc) {
  if (!doc) return null;

  return {
    key: doc.key,
    computedAt: doc.computedAt,
    windowStart: doc.windowStart,
    windowEnd: doc.windowEnd,
    top: await withLeaders(doc),
  };
}

router.get("/trending", async (req, res) => {
  const now = new Date();
  const latest = await Trending.findOne().sort({ computedAt: -1 }).lean();

  res.json({
    trending: await present(latest),
    isCurrentWeek: latest?.key === weekKey(now),
    nextRefreshAt: nextRefreshAt(now),
  });
});

router.post("/trending/refresh", async (req, res) => {
  const doc = await refreshTrending();
  res.json({ trending: await present(doc) });
});

module.exports = router;
