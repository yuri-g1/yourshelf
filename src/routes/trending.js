const express = require("express");
const Trending = require("../models/Trending");
const { weekKey, nextRefreshAt, refreshTrending } = require("../lib/trending");

const router = express.Router();

function present(doc) {
  if (!doc) return null;

  return {
    key: doc.key,
    computedAt: doc.computedAt,
    windowStart: doc.windowStart,
    windowEnd: doc.windowEnd,
    top: doc.top,
  };
}

router.get("/trending", async (req, res) => {
  const now = new Date();
  const latest = await Trending.findOne().sort({ computedAt: -1 }).lean();

  res.json({
    trending: present(latest),
    isCurrentWeek: latest?.key === weekKey(now),
    nextRefreshAt: nextRefreshAt(now),
  });
});

router.post("/trending/refresh", async (req, res) => {
  const doc = await refreshTrending();
  res.json({ trending: present(doc) });
});

module.exports = router;
