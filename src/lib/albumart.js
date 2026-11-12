const fanart = require("./fanart");

const MB_URL = "https://musicbrainz.org/ws/2/release/";
const USER_AGENT = "yourshelf/1.0 (personal project)";
const MB_SPACING_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const BARCODE = /^\d{8,14}$/;

const discCache = new Map();
const pending = new Set();
let queue = Promise.resolve();

function remember(barcode, value) {
  if (discCache.size >= MAX_CACHE_ENTRIES) {
    discCache.delete(discCache.keys().next().value);
  }

  discCache.set(barcode, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cachedDisc(barcode) {
  const cached = discCache.get(barcode);
  return cached && Date.now() < cached.expiresAt ? cached.value : null;
}

async function releaseGroupFor(barcode) {
  const url = new URL(MB_URL);
  url.searchParams.set("query", `barcode:${barcode}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.releases?.[0]?.["release-group"]?.id || null;
}

async function lookup(barcode) {
  try {
    const group = await releaseGroupFor(barcode);
    remember(barcode, group ? await fanart.getAlbumDisc(group) : null);
  } catch (error) {
    console.error("album art lookup failed:", error.message);
  } finally {
    pending.delete(barcode);
  }
}

function warm(barcode) {
  if (!fanart.isConfigured() || !BARCODE.test(barcode || "")) return;
  if (discCache.has(barcode) && Date.now() < discCache.get(barcode).expiresAt) return;
  if (pending.has(barcode)) return;

  pending.add(barcode);
  queue = queue
    .then(() => lookup(barcode))
    .then(() => new Promise((resolve) => setTimeout(resolve, MB_SPACING_MS)));
}

module.exports = { cachedDisc, warm };
