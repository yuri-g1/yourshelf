const sharp = require("sharp");
const fanart = require("./fanart");
const AlbumDisc = require("../models/AlbumDisc");

const MB_URL = "https://musicbrainz.org/ws/2";
const CAA_URL = "https://coverartarchive.org/release";
const USER_AGENT = "yourshelf/1.0 (personal project)";
const MB_SPACING_MS = 1100;
const MB_RETRIES = 3;
const MB_BACKOFF_MS = 3000;
const FOUND_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const MISSING_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const BARCODE = /^\d{8,14}$/;
const MIN_GROUP_SCORE = 90;
const MAX_RELEASES = 8;
const SCAN_SIZE = 200;
const CORNER = 5;
const BACKGROUND_DISTANCE = 48;
const EDGE_FILL = 0.06;
const MIN_DISC_SPAN = 0.4;
const MAX_SKEW = 0.12;
const RIM_INSET = 0.985;

const pending = new Set();
let queue = Promise.resolve();
let mbNextAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function musicbrainz(path, params, attempt = 0) {
  const wait = mbNextAt - Date.now();
  mbNextAt = Math.max(Date.now(), mbNextAt) + MB_SPACING_MS;
  if (wait > 0) await sleep(wait);

  const url = new URL(MB_URL + path);
  url.searchParams.set("fmt", "json");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (response.status === 503 && attempt < MB_RETRIES) {
    mbNextAt = Math.max(mbNextAt, Date.now() + MB_BACKOFF_MS * (attempt + 1));
    return musicbrainz(path, params, attempt + 1);
  }

  if (!response.ok) throw new Error(`MusicBrainz responded ${response.status}`);
  return response.json();
}

function quoted(text) {
  return `"${String(text).replace(/["\\]/g, " ").trim()}"`;
}

async function releaseGroupFor(album) {
  if (BARCODE.test(album.barcode || "")) {
    const data = await musicbrainz("/release", { query: `barcode:${album.barcode}`, limit: "1" });
    const group = data.releases?.[0]?.["release-group"]?.id;
    if (group) return group;
  }

  if (!album.title || !album.creator) return null;

  const title = album.title.replace(/\s*[([][^)\]]*[)\]]/g, "").trim() || album.title;
  const data = await musicbrainz("/release-group", {
    query: `releasegroup:${quoted(title)} AND artist:${quoted(album.creator)} AND primarytype:album`,
    limit: "1",
  });
  const group = data["release-groups"]?.[0];
  return group && Number(group.score) >= MIN_GROUP_SCORE ? group.id : null;
}

function isCompactDisc(release) {
  return (release.media || []).some((medium) => /CD/.test(medium.format || ""));
}

function secure(url) {
  return url.replace(/^http:/, "https:");
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function fetchImage(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return response.ok ? Buffer.from(await response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

async function findDisc(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(SCAN_SIZE, SCAN_SIZE, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const colorAt = (x, y) => {
    const at = (y * width + x) * channels;
    return [data[at], data[at + 1], data[at + 2]];
  };

  const cornerColor = (startX, startY) => {
    const sum = [0, 0, 0];
    for (let y = startY; y < startY + CORNER; y += 1) {
      for (let x = startX; x < startX + CORNER; x += 1) {
        colorAt(x, y).forEach((value, channel) => {
          sum[channel] += value;
        });
      }
    }
    return sum.map((value) => value / (CORNER * CORNER));
  };

  const backgrounds = [
    cornerColor(0, 0),
    cornerColor(width - CORNER, 0),
    cornerColor(0, height - CORNER),
    cornerColor(width - CORNER, height - CORNER),
  ];

  const isBackground = (color) =>
    backgrounds.some((bg) => Math.max(...color.map((value, channel) => Math.abs(value - bg[channel]))) < BACKGROUND_DISTANCE);

  const columns = new Array(width).fill(0);
  const rows = new Array(height).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (isBackground(colorAt(x, y))) continue;
      columns[x] += 1;
      rows[y] += 1;
    }
  }

  const span = (counts, across) => {
    const filled = (count) => count > across * EDGE_FILL;
    const first = counts.findIndex(filled);
    const last = counts.findLastIndex(filled);
    return first === -1 ? null : [first, last + 1];
  };

  const xs = span(columns, height);
  const ys = span(rows, width);
  if (!xs || !ys) return null;

  const discWidth = xs[1] - xs[0];
  const discHeight = ys[1] - ys[0];
  if (discWidth < width * MIN_DISC_SPAN || discHeight < height * MIN_DISC_SPAN) return null;
  if (Math.abs(discWidth / discHeight - 1) > MAX_SKEW) return null;

  const radius = (Math.min(discWidth, discHeight) / 2) * RIM_INSET;

  return {
    x: round((xs[0] + xs[1]) / 2 / width),
    y: round((ys[0] + ys[1]) / 2 / height),
    rx: round(radius / width),
    ry: round(radius / height),
  };
}

async function scanFromArchive(groupId) {
  const data = await musicbrainz("/release", { "release-group": groupId, inc: "media", limit: "100" });
  const releases = (data.releases || [])
    .filter((release) => release["cover-art-archive"]?.count > 0)
    .sort((a, b) => (isCompactDisc(a) ? 0 : 1) - (isCompactDisc(b) ? 0 : 1))
    .slice(0, MAX_RELEASES);

  for (const release of releases) {
    const listing = await fetchJson(`${CAA_URL}/${release.id}`);
    const scans = (listing?.images || []).filter((image) => image.types?.includes("Medium"));

    for (const scan of scans) {
      const url = secure(scan.thumbnails?.["500"] || scan.thumbnails?.large || scan.image);
      const buffer = await fetchImage(url);
      if (!buffer) continue;

      try {
        const crop = await findDisc(buffer);
        if (crop) return { discArt: url, crop };
      } catch (error) {
        console.error("disc scan analysis failed:", error.message);
      }
    }
  }

  return null;
}

async function findArt(album) {
  const group = await releaseGroupFor(album);
  if (!group) return null;

  const cutout = await fanart.getAlbumDisc(group);
  if (cutout) return { discArt: cutout, crop: null };

  return scanFromArchive(group);
}

async function lookup(album) {
  try {
    const found = await findArt(album);
    await AlbumDisc.updateOne(
      { externalId: album.externalId },
      { $set: { discArt: found?.discArt || null, crop: found?.crop || null, checkedAt: new Date() } },
      { upsert: true },
    );
  } catch (error) {
    console.error("album art lookup failed:", error.message);
  } finally {
    pending.delete(album.externalId);
  }
}

function isStale(record) {
  const ttl = record.discArt ? FOUND_TTL_MS : MISSING_TTL_MS;
  return Date.now() - new Date(record.checkedAt).getTime() > ttl;
}

async function discsFor(externalIds) {
  if (externalIds.length === 0) return new Map();

  try {
    const records = await AlbumDisc.find({ externalId: { $in: externalIds } }).lean();
    return new Map(records.map((record) => [record.externalId, record]));
  } catch (error) {
    console.error("album disc read failed:", error.message);
    return new Map();
  }
}

function warm(album) {
  if (!album?.externalId || pending.has(album.externalId)) return;

  pending.add(album.externalId);
  queue = queue.then(() => lookup(album));
}

module.exports = { discsFor, isStale, warm };
