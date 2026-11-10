const BASE_URL = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;

const movieCache = new Map();

class TmdbError extends Error {
  constructor(message) {
    super(message);
    this.name = "TmdbError";
  }
}

function credential() {
  return process.env.TMDB_API_KEY || "";
}

function isConfigured() {
  return Boolean(credential());
}

async function request(path, params = {}) {
  if (!isConfigured()) throw new TmdbError("TMDB_API_KEY is not set");

  const key = credential();
  const isReadToken = key.startsWith("eyJ");
  const url = new URL(BASE_URL + path);
  const headers = { Accept: "application/json" };

  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  if (isReadToken) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });

  if (!response.ok) throw new TmdbError(`TMDB responded ${response.status}`);

  return response.json();
}

function toMovie(raw) {
  return {
    externalId: String(raw.id),
    title: String(raw.title || raw.original_title || "").slice(0, 100),
    desc: String(raw.overview || "").slice(0, 500),
    posterPath: raw.poster_path || null,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
  };
}

async function searchMovies(query) {
  const data = await request("/search/movie", {
    query,
    include_adult: "false",
    page: "1",
  });

  return (data.results || []).slice(0, 10).map(toMovie);
}

async function getMovie(externalId) {
  const cached = movieCache.get(externalId);

  if (cached && Date.now() < cached.expiresAt) return cached.movie;

  const movie = toMovie(await request(`/movie/${externalId}`));

  if (movieCache.size >= MAX_CACHE_ENTRIES) {
    movieCache.delete(movieCache.keys().next().value);
  }

  movieCache.set(externalId, { movie, expiresAt: Date.now() + CACHE_TTL_MS });

  return movie;
}

module.exports = { isConfigured, searchMovies, getMovie, TmdbError };
