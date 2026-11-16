const mongoose = require("mongoose");
const User = require("../models/User");
const Trending = require("../models/Trending");
const { catalogs } = require("./catalogs");

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;
const TOP_SIZE = 10;
const REFRESH_WEEKDAY = 1;
const REFRESH_HOUR_UTC = 3;

function isoWeek(date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day - yearStart) / DAY_MS + 1) / 7);
  return { year: day.getUTCFullYear(), week };
}

function weekKey(date) {
  const { year, week } = isoWeek(date);
  return `${year}-w${String(week).padStart(2, "0")}`;
}

function nextRefreshAt(now) {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), REFRESH_HOUR_UTC),
  );
  next.setUTCDate(next.getUTCDate() + ((REFRESH_WEEKDAY - next.getUTCDay() + 7) % 7));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

function topForField(field, since) {
  const sinceId = mongoose.Types.ObjectId.createFromTime(Math.floor(since.getTime() / 1000));

  return User.aggregate([
    { $project: { item: `$shelf.${field}` } },
    { $unwind: "$item" },
    {
      $match: {
        "item._id": { $gte: sinceId },
        "item.recommendedBy": null,
        "item.externalId": { $type: "string", $ne: "" },
      },
    },
    { $sort: { "item._id": -1 } },
    { $group: { _id: { user: "$_id", externalId: "$item.externalId" }, item: { $first: "$item" } } },
    { $sort: { "item._id": -1 } },
    {
      $group: {
        _id: "$_id.externalId",
        count: { $sum: 1 },
        latest: { $max: "$item._id" },
        item: { $first: "$item" },
      },
    },
    { $sort: { count: -1, latest: -1 } },
    { $limit: TOP_SIZE },
    {
      $project: {
        _id: 0,
        externalId: "$_id",
        count: 1,
        title: "$item.title",
        posterPath: "$item.posterPath",
        creator: "$item.creator",
      },
    },
  ]);
}

async function computeTop(now) {
  const since = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const entries = await Promise.all(
    Object.entries(catalogs).map(async ([kind, catalog]) => [kind, await topForField(catalog.field, since)]),
  );

  return { windowStart: since, windowEnd: now, top: Object.fromEntries(entries) };
}

async function refreshTrending(now = new Date()) {
  const key = weekKey(now);
  const { windowStart, windowEnd, top } = await computeTop(now);

  return Trending.findOneAndUpdate(
    { key },
    { key, computedAt: now, windowStart, windowEnd, top },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
}

module.exports = { weekKey, nextRefreshAt, computeTop, refreshTrending };
