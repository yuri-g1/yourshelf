const {
  createCache,
  formatDate,
  formatLength,
  formatClock,
  formatCount,
  fact,
  compact,
} = require("./details");

const BASE_URL = "https://api.deezer.com";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const BATCH_SIZE = 10;
const SEARCH_POOL = 25;
const SEARCH_LIMIT = 10;
const ALBUM_ID = /^\d+$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DETAILS_TTL_MS = 10 * 60 * 1000;
const NOT_FOUND_CODE = 800;
const RECORD_TYPES = { ep: "EP", single: "Single", compile: "Compilation" };

const albumCache = new Map();
const detailsCache = createCache(DETAILS_TTL_MS);

class DeezerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "DeezerError";
    this.status = status;
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

  if (data.error) {
    throw new DeezerError(`Deezer error: ${data.error.message}`, data.error.code === NOT_FOUND_CODE ? 404 : undefined);
  }

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

async function allTracks(raw) {
  const tracks = raw.tracks?.data || [];
  if (!raw.nb_tracks || tracks.length >= raw.nb_tracks) return tracks;

  const data = await request(`/album/${raw.id}/tracks`, { limit: "200" });
  return data.data || tracks;
}

async function moreFromArtist(raw) {
  if (!raw.artist?.id) return [];

  try {
    const data = await request(`/artist/${raw.artist.id}/albums`, { limit: "50" });
    const seen = new Set([String(raw.title).toLowerCase()]);

    return (data.data || [])
      .filter((album) => album.record_type === "album" && album.id !== raw.id)
      .sort((a, b) => (b.fans || 0) - (a.fans || 0))
      .filter((album) => {
        const key = String(album.title).toLowerCase();
        return !seen.has(key) && seen.add(key);
      })
      .slice(0, 12)
      .map((album) => ({
        externalId: String(album.id),
        title: album.title,
        year: album.release_date ? album.release_date.slice(0, 4) : null,
        image: album.cover_big || album.cover_medium || null,
      }));
  } catch (error) {
    console.error("Deezer artist albums failed:", error.message);
    return [];
  }
}

function toDetails(raw, tracks, similar) {
  const main = raw.artist?.name || "";
  const genres = (raw.genres?.data || []).map((genre) => genre.name);
  const length = formatLength(raw.duration);
  const count = raw.nb_tracks ? `${raw.nb_tracks} ${raw.nb_tracks === 1 ? "track" : "tracks"}` : null;

  return {
    kind: "album",
    externalId: String(raw.id),
    title: String(raw.title || ""),
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    creator: main || null,
    tagline: null,
    desc: "",
    story: null,
    poster: raw.cover_xl || raw.cover_big || null,
    backdrop: null,
    rating: null,
    highlights: compact([count, length, genres[0]]),
    genres,
    facts: compact([
      fact("Released", formatDate(raw.release_date)),
      fact("Type", RECORD_TYPES[raw.record_type]),
      fact("Tracks", raw.nb_tracks),
      fact("Length", length),
      fact("Label", raw.label),
      fact("Fans on Deezer", formatCount(raw.fans)),
    ]),
    people: {
      label: "Artists",
      list: (raw.contributors || []).slice(0, 12).map((artist) => ({
        name: artist.name,
        role: artist.role === "Main" ? null : artist.role,
        image: artist.picture_medium || null,
      })),
    },
    tracks: tracks.map((track, index) => ({
      position: index + 1,
      title: track.title,
      artist: track.artist?.name && track.artist.name !== main ? track.artist.name : null,
      length: formatClock(track.duration),
      preview: track.preview || null,
      explicit: Boolean(track.explicit_lyrics),
    })),
    videos: [],
    gallery: { label: "", list: [] },
    similar: { label: main ? `More from ${main}` : "More albums", list: similar },
    links: compact([
      raw.link ? { label: "Deezer", url: raw.link } : null,
      raw.artist?.id ? { label: main ? `${main} on Deezer` : "Artist on Deezer", url: `https://www.deezer.com/artist/${raw.artist.id}` } : null,
    ]),
    watch: null,
  };
}

async function getAlbumDetails(externalId) {
  const cached = detailsCache.get(externalId);
  if (cached) return cached;

  const raw = await request(`/album/${externalId}`);
  const [tracks, similar] = await Promise.all([allTracks(raw), moreFromArtist(raw)]);

  return detailsCache.set(externalId, toDetails(raw, tracks, similar));
}

module.exports = { isConfigured, searchAlbums, getAlbums, describeAlbum, getAlbumDetails, DeezerError };
