const {
  createCache,
  formatDate,
  formatLength,
  formatMoney,
  joinNames,
  fact,
  compact,
  youtubeVideo,
} = require("./details");

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const DETAILS_APPEND = "credits,videos,images,watch/providers,recommendations,release_dates";
const VIDEO_TYPES = ["Trailer", "Teaser", "Clip", "Featurette"];
const WATCH_GROUPS = [
  ["flatrate", "Stream"],
  ["free", "Free"],
  ["ads", "With ads"],
  ["rent", "Rent"],
  ["buy", "Buy"],
];

const movieCache = new Map();
const detailsCache = createCache(CACHE_TTL_MS);

class TmdbError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
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

  if (!response.ok) throw new TmdbError(`TMDB responded ${response.status}`, response.status);

  return response.json();
}

function image(size, path) {
  return path ? `${IMAGE_URL}${size}${path}` : null;
}

function titleLogo(raw) {
  const logos = raw.images?.logos || [];
  const best = [...logos].sort(
    (a, b) => (a.iso_639_1 === "en" ? 0 : 1) - (b.iso_639_1 === "en" ? 0 : 1) || b.vote_average - a.vote_average,
  )[0];
  return best?.file_path ? `https://image.tmdb.org/t/p/w300${best.file_path}` : null;
}

function toMovie(raw) {
  return {
    externalId: String(raw.id),
    title: String(raw.title || raw.original_title || "").slice(0, 100),
    desc: String(raw.overview || "").slice(0, 500),
    posterPath: raw.poster_path || null,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    titleLogo: titleLogo(raw),
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

  const movie = toMovie(
    await request(`/movie/${externalId}`, {
      append_to_response: "images",
      include_image_language: "en,null",
    }),
  );

  if (movieCache.size >= MAX_CACHE_ENTRIES) {
    movieCache.delete(movieCache.keys().next().value);
  }

  movieCache.set(externalId, { movie, expiresAt: Date.now() + CACHE_TTL_MS });

  return movie;
}

function certificationFor(raw, region) {
  const results = raw.release_dates?.results || [];

  for (const code of [region, "US"]) {
    const dates = results.find((entry) => entry.iso_3166_1 === code)?.release_dates || [];
    const rated = dates.find((entry) => entry.certification?.trim());
    if (rated) return rated.certification.trim();
  }

  return null;
}

function crewNames(raw, jobs) {
  return (raw.credits?.crew || []).filter((member) => jobs.includes(member.job)).map((member) => member.name);
}

function pickVideos(raw) {
  return (raw.videos?.results || [])
    .filter((video) => video.site === "YouTube" && VIDEO_TYPES.includes(video.type))
    .sort(
      (a, b) =>
        VIDEO_TYPES.indexOf(a.type) - VIDEO_TYPES.indexOf(b.type) ||
        Number(b.official) - Number(a.official) ||
        String(a.published_at).localeCompare(String(b.published_at)),
    )
    .slice(0, 4)
    .map((video) => youtubeVideo(video.key, video.name));
}

function pickGallery(raw) {
  return (raw.images?.backdrops || [])
    .filter((backdrop) => backdrop.file_path)
    .sort((a, b) => Number(a.iso_639_1 !== null) - Number(b.iso_639_1 !== null) || b.vote_average - a.vote_average)
    .slice(0, 12)
    .map((backdrop) => ({ thumb: image("w780", backdrop.file_path), full: image("w1280", backdrop.file_path) }));
}

function watchFor(providers, region) {
  const entry = providers[region];
  if (!entry) return null;

  const seen = new Set();
  const groups = [];

  for (const [key, label] of WATCH_GROUPS) {
    const list = (entry[key] || [])
      .filter((provider) => !seen.has(provider.provider_id))
      .sort((a, b) => a.display_priority - b.display_priority)
      .slice(0, 6)
      .map((provider) => {
        seen.add(provider.provider_id);
        return { name: provider.provider_name, logo: image("w92", provider.logo_path) };
      });

    if (list.length > 0) groups.push({ label, providers: list });
  }

  return groups.length > 0 ? { region, link: entry.link || null, credit: "JustWatch", groups } : null;
}

function toDetails(raw) {
  const directors = crewNames(raw, ["Director"]);
  const writers = crewNames(raw, ["Screenplay", "Writer", "Story", "Novel"]);
  const runtime = formatLength((raw.runtime || 0) * 60);
  const genres = (raw.genres || []).map((genre) => genre.name);
  const title = String(raw.title || raw.original_title || "");

  return {
    kind: "movie",
    externalId: String(raw.id),
    title,
    year: raw.release_date ? raw.release_date.slice(0, 4) : null,
    creator: joinNames(directors, 2),
    tagline: raw.tagline || null,
    desc: raw.overview || "",
    story: null,
    poster: image("w500", raw.poster_path),
    backdrop: image("w1280", raw.backdrop_path),
    rating: raw.vote_count > 0 ? { value: Number(raw.vote_average.toFixed(1)), scale: 10, count: raw.vote_count } : null,
    highlights: compact([runtime, ...genres.slice(0, 2)]),
    genres,
    facts: compact([
      fact("Released", formatDate(raw.release_date)),
      fact("Runtime", runtime),
      fact("Directed by", joinNames(directors)),
      fact("Written by", joinNames(writers)),
      fact("Original title", raw.original_title !== title ? raw.original_title : null),
      fact("Studio", joinNames((raw.production_companies || []).map((company) => company.name), 2)),
      fact("Budget", formatMoney(raw.budget)),
      fact("Box office", formatMoney(raw.revenue)),
    ]),
    people: {
      label: "Cast",
      list: (raw.credits?.cast || []).slice(0, 18).map((person) => ({
        name: person.name,
        role: person.character || null,
        image: image("w185", person.profile_path),
      })),
    },
    tracks: [],
    videos: pickVideos(raw),
    gallery: { label: "Stills", list: pickGallery(raw) },
    similar: {
      label: "You might also like",
      list: (raw.recommendations?.results || []).slice(0, 12).map((movie) => ({
        externalId: String(movie.id),
        title: movie.title,
        year: movie.release_date ? movie.release_date.slice(0, 4) : null,
        image: image("w342", movie.poster_path),
      })),
    },
    links: compact([
      { label: "TMDB", url: `https://www.themoviedb.org/movie/${raw.id}` },
      raw.imdb_id ? { label: "IMDb", url: `https://www.imdb.com/title/${raw.imdb_id}/` } : null,
      raw.homepage ? { label: "Official site", url: raw.homepage } : null,
    ]),
    watch: null,
  };
}

function withRating(facts, rated) {
  if (!rated) return facts;
  const at = facts.findIndex((entry) => entry.label === "Runtime") + 1 || facts.length;
  return [...facts.slice(0, at), fact("Rated", rated), ...facts.slice(at)];
}

async function getMovieDetails(externalId, region = "US") {
  let entry = detailsCache.get(externalId);

  if (!entry) {
    const raw = await request(`/movie/${externalId}`, {
      append_to_response: DETAILS_APPEND,
      include_image_language: "en,null",
    });

    entry = detailsCache.set(externalId, {
      details: toDetails(raw),
      releases: { release_dates: raw.release_dates },
      providers: raw["watch/providers"]?.results || {},
    });
  }

  return {
    ...entry.details,
    facts: withRating(entry.details.facts, certificationFor(entry.releases, region)),
    watch: watchFor(entry.providers, region),
  };
}

module.exports = { isConfigured, searchMovies, getMovie, getMovieDetails, TmdbError };
