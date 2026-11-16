const { createCache, formatDate, joinNames, fact, compact, youtubeVideo } = require("./details");

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const BASE_URL = "https://api.igdb.com/v4";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const TOKEN_MARGIN_MS = 60 * 1000;
const FIELDS = "name,summary,cover.image_id,first_release_date,platforms.abbreviation";
const PLATFORM_ORDER = ["PS5", "PS4", "Switch 2", "Switch", "Series X|S", "XONE", "PS3", "X360", "WiiU", "Wii", "PS2", "NGC", "PC"];
const SEARCH_FIELDS = `${FIELDS},total_rating_count`;
const RELEASE_TYPES = "(0,2,4,8,9,10)";
const SEARCH_POOL = 25;
const SEARCH_LIMIT = 10;

const IMAGE_URL = "https://images.igdb.com/igdb/image/upload/";
const DETAIL_FIELDS = [
  "name",
  "summary",
  "storyline",
  "url",
  "cover.image_id",
  "first_release_date",
  "total_rating",
  "total_rating_count",
  "genres.name",
  "themes.name",
  "game_modes.name",
  "player_perspectives.name",
  "platforms.name",
  "platforms.abbreviation",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "screenshots.image_id",
  "artworks.image_id",
  "videos.video_id",
  "videos.name",
  "websites.url",
  "websites.type.type",
  "similar_games.name",
  "similar_games.cover.image_id",
  "similar_games.first_release_date",
  "franchises.name",
].join(",");
const WEBSITE_LABELS = {
  "Official Website": "Official site",
  Steam: "Steam",
  Epic: "Epic Games",
  GOG: "GOG",
  Playstation: "PlayStation",
  Xbox: "Xbox",
  Nintendo: "Nintendo",
  Itch: "itch.io",
  Wikipedia: "Wikipedia",
};
const WEBSITE_ORDER = Object.keys(WEBSITE_LABELS);

const gameCache = new Map();
const detailsCache = createCache(CACHE_TTL_MS);
let token = null;
let tokenRequest = null;

class IgdbError extends Error {
  constructor(message) {
    super(message);
    this.name = "IgdbError";
  }
}

function isConfigured() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

async function fetchToken() {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", process.env.TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  const response = await fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) });

  if (!response.ok) throw new IgdbError(`Twitch token responded ${response.status}`);

  const data = await response.json();

  return {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - TOKEN_MARGIN_MS,
  };
}

async function accessToken() {
  if (token && Date.now() < token.expiresAt) return token.value;

  tokenRequest ??= fetchToken().finally(() => {
    tokenRequest = null;
  });
  token = await tokenRequest;

  return token.value;
}

async function request(endpoint, body, retry = true) {
  if (!isConfigured()) throw new IgdbError("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not set");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${await accessToken()}`,
    },
    body,
    signal: AbortSignal.timeout(5000),
  });

  if (response.status === 401 && retry) {
    token = null;
    return request(endpoint, body, false);
  }

  if (!response.ok) throw new IgdbError(`IGDB responded ${response.status}`);

  return response.json();
}

function pickPlatform(raw) {
  const names = (raw.platforms || []).map((platform) => platform.abbreviation).filter(Boolean);
  return PLATFORM_ORDER.find((name) => names.includes(name)) || names[0] || null;
}

function toGame(raw) {
  return {
    externalId: String(raw.id),
    title: String(raw.name || "").slice(0, 100),
    desc: String(raw.summary || "").slice(0, 500),
    posterPath: raw.cover?.image_id || null,
    year: raw.first_release_date
      ? String(new Date(raw.first_release_date * 1000).getUTCFullYear())
      : null,
    platform: pickPlatform(raw),
  };
}

function remember(game) {
  if (gameCache.size >= MAX_CACHE_ENTRIES) {
    gameCache.delete(gameCache.keys().next().value);
  }

  gameCache.set(game.externalId, { game, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function searchGames(query) {
  const term = query.replace(/["\\]/g, " ");
  const data = await request(
    "/games",
    `search "${term}"; fields ${SEARCH_FIELDS}; where version_parent = null & game_type = ${RELEASE_TYPES}; limit ${SEARCH_POOL};`,
  );

  return data
    .map((raw, index) => ({ raw, index, ratings: raw.total_rating_count || 0 }))
    .sort((a, b) => b.ratings - a.ratings || a.index - b.index)
    .slice(0, SEARCH_LIMIT)
    .map(({ raw }) => toGame(raw));
}

async function getGames(externalIds) {
  const result = new Map();
  const missing = [];

  for (const id of new Set(externalIds)) {
    const cached = gameCache.get(id);
    if (cached && Date.now() < cached.expiresAt) result.set(id, cached.game);
    else missing.push(id);
  }

  if (missing.length > 0) {
    const data = await request(
      "/games",
      `fields ${FIELDS}; where id = (${missing.join(",")}); limit ${missing.length};`,
    );

    for (const raw of data) {
      const game = toGame(raw);
      remember(game);
      result.set(game.externalId, game);
    }
  }

  return result;
}

function image(size, id) {
  return id ? `${IMAGE_URL}t_${size}/${id}.jpg` : null;
}

function yearOf(timestamp) {
  return timestamp ? String(new Date(timestamp * 1000).getUTCFullYear()) : null;
}

function names(list) {
  return (list || []).map((entry) => entry.name).filter(Boolean);
}

function companies(raw, role) {
  return (raw.involved_companies || [])
    .filter((entry) => entry[role])
    .map((entry) => entry.company?.name);
}

function pickLinks(raw) {
  const seen = new Set();
  const sites = (raw.websites || [])
    .filter((site) => WEBSITE_LABELS[site.type?.type] && site.url)
    .sort((a, b) => WEBSITE_ORDER.indexOf(a.type.type) - WEBSITE_ORDER.indexOf(b.type.type))
    .filter((site) => !seen.has(site.type.type) && seen.add(site.type.type))
    .map((site) => ({ label: WEBSITE_LABELS[site.type.type], url: site.url }));

  return compact([raw.url ? { label: "IGDB", url: raw.url } : null, ...sites]);
}

function toDetails(raw) {
  const developers = companies(raw, "developer");
  const genres = [...new Set([...names(raw.genres), ...names(raw.themes)])].slice(0, 8);
  const art = raw.artworks?.[0]?.image_id || raw.screenshots?.[0]?.image_id;
  const shots = [
    ...(raw.screenshots || []).map((shot) => shot.image_id),
    ...(raw.artworks || []).map((shot) => shot.image_id),
  ].filter(Boolean);
  const date = raw.first_release_date ? new Date(raw.first_release_date * 1000).toISOString() : null;

  return {
    kind: "game",
    externalId: String(raw.id),
    title: String(raw.name || ""),
    year: yearOf(raw.first_release_date),
    creator: joinNames(developers, 2),
    tagline: null,
    desc: raw.summary || "",
    story: raw.storyline && raw.storyline !== raw.summary ? raw.storyline : null,
    poster: image("cover_big", raw.cover?.image_id),
    backdrop: image("1080p", art),
    rating:
      raw.total_rating_count > 0
        ? { value: Math.round(raw.total_rating), scale: 100, count: raw.total_rating_count }
        : null,
    highlights: compact([pickPlatform(raw), ...names(raw.genres).slice(0, 2)]),
    genres,
    facts: compact([
      fact("Released", formatDate(date)),
      fact("Developer", joinNames(developers)),
      fact("Publisher", joinNames(companies(raw, "publisher"))),
      fact("Platforms", joinNames(names(raw.platforms), 12)),
      fact("Modes", joinNames(names(raw.game_modes))),
      fact("Perspective", joinNames(names(raw.player_perspectives), 2)),
      fact("Series", joinNames(names(raw.franchises), 2)),
    ]),
    people: { label: "", list: [] },
    tracks: [],
    videos: (raw.videos || [])
      .filter((video) => video.video_id)
      .slice(0, 4)
      .map((video) => youtubeVideo(video.video_id, video.name)),
    gallery: {
      label: "Screenshots",
      list: [...new Set(shots)].slice(0, 16).map((id) => ({
        thumb: image("screenshot_big", id),
        full: image("1080p", id),
      })),
    },
    similar: {
      label: "Similar games",
      list: (raw.similar_games || []).slice(0, 12).map((game) => ({
        externalId: String(game.id),
        title: game.name,
        year: yearOf(game.first_release_date),
        image: image("cover_big", game.cover?.image_id),
      })),
    },
    links: pickLinks(raw),
    watch: null,
  };
}

async function getGameDetails(externalId) {
  const cached = detailsCache.get(externalId);
  if (cached !== undefined) return cached;

  const data = await request("/games", `fields ${DETAIL_FIELDS}; where id = ${externalId}; limit 1;`);

  return detailsCache.set(externalId, data[0] ? toDetails(data[0]) : null);
}

module.exports = { isConfigured, searchGames, getGames, getGameDetails, IgdbError };
