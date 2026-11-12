const BASE_URL = "https://api.deezer.com";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const BATCH_SIZE = 10;
const SEARCH_POOL = 25;
const SEARCH_LIMIT = 10;
const ALBUM_ID = /^\d+$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const albumCache = new Map();

class DeezerError extends Error {
  constructor(message) {
    super(message);
    this.name = "DeezerError";
  }
}

function isConfigured() {
  return true;
}

async function request(path, params = {}) {
  const url = new URL(BASE_URL + path);

  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new DeezerError(`Deezer responded ${response.status}`);

  const data = await response.json();

  if (data.error) throw new DeezerError(`Deezer error: ${data.error.message}`);

  return data;
}

function releaseText(date) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function describe(raw) {
  const parts = [];

  if (raw.nb_tracks) parts.push(`${raw.nb_tracks} ${raw.nb_tracks === 1 ? "track" : "tracks"}`);

  const released = releaseText(raw.release_date);
  if (released) parts.push(`released ${released}`);
  if (raw.label) parts.push(`on ${raw.label}`);

  if (parts.length === 0) return "";

  const text = parts.join(", ").replace(", on", " on");
  const sentence = `${text[0].toUpperCase()}${text.slice(1)}`;
  return (sentence.endsWith(".") ? sentence : `${sentence}.`).slice(0, 500);
}

function toAlbum(raw) {
  return {
    externalId: String(raw.id),
    title: String(raw.title || "").slice(0, 100),
    desc: describe(raw),
    posterPath: raw.md5_image || null,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    creator: raw.artist?.name?.slice(0, 100) || null,
    barcode: raw.upc || null,
  };
}

async function searchAlbums(query) {
  const data = await request("/search/album", { q: query, limit: String(SEARCH_POOL) });

  return (data.data || [])
    .filter((raw) => raw.record_type !== "single")
    .slice(0, SEARCH_LIMIT)
    .map((raw) => ({ ...toAlbum(raw), desc: "" }));
}

async function getAlbum(externalId) {
  const cached = albumCache.get(externalId);

  if (cached && Date.now() < cached.expiresAt) return cached.album;

  const album = toAlbum(await request(`/album/${externalId}`));

  if (albumCache.size >= MAX_CACHE_ENTRIES) {
    albumCache.delete(albumCache.keys().next().value);
  }

  albumCache.set(externalId, { album, expiresAt: Date.now() + CACHE_TTL_MS });

  return album;
}

async function getAlbums(externalIds) {
  const ids = [...new Set(externalIds)].filter((id) => ALBUM_ID.test(id));
  const result = new Map();

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const albums = await Promise.allSettled(batch.map(getAlbum));

    albums.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") result.set(batch[index], outcome.value);
    });
  }

  return result;
}

async function describeAlbum(externalId) {
  if (!ALBUM_ID.test(externalId)) return "";
  return (await getAlbum(externalId)).desc;
}

module.exports = { isConfigured, searchAlbums, getAlbums, describeAlbum, DeezerError };
