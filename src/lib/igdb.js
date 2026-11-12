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

const gameCache = new Map();
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

module.exports = { isConfigured, searchGames, getGames, IgdbError };
