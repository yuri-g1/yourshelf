const tmdb = require("./tmdb");
const igdb = require("./igdb");

const MOVIE_BATCH_SIZE = 10;

async function getMovies(externalIds) {
  const ids = [...new Set(externalIds)];
  const result = new Map();

  for (let i = 0; i < ids.length; i += MOVIE_BATCH_SIZE) {
    const batch = ids.slice(i, i + MOVIE_BATCH_SIZE);
    const movies = await Promise.allSettled(batch.map((id) => tmdb.getMovie(id)));

    movies.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") result.set(batch[index], outcome.value);
    });
  }

  return result;
}

const catalogs = {
  movie: {
    field: "movies",
    noun: "movie",
    plural: "movies",
    source: "TMDB",
    isConfigured: tmdb.isConfigured,
    search: tmdb.searchMovies,
    getMany: getMovies,
    isSourceError: (error) => error instanceof tmdb.TmdbError,
  },
  game: {
    field: "games",
    noun: "game",
    plural: "games",
    source: "IGDB",
    isConfigured: igdb.isConfigured,
    search: igdb.searchGames,
    getMany: igdb.getGames,
    isSourceError: (error) => error instanceof igdb.IgdbError,
  },
};

function catalogFor(kind) {
  return Object.hasOwn(catalogs, kind) ? catalogs[kind] : null;
}

async function withLiveData(catalog, items) {
  const stored = items.map((item) => item.toObject());
  const ids = stored.map((item) => item.externalId).filter(Boolean);

  if (ids.length === 0 || !catalog.isConfigured()) return stored;

  let live;

  try {
    live = await catalog.getMany(ids);
  } catch (error) {
    console.error(`${catalog.source} lookup failed:`, error.message);
    return stored;
  }

  return stored.map((item) => {
    const fresh = item.externalId && live.get(item.externalId);
    if (!fresh) return item;

    return {
      ...item,
      title: fresh.title || item.title,
      desc: fresh.desc || item.desc,
      posterPath: fresh.posterPath || item.posterPath,
      year: fresh.year,
    };
  });
}

module.exports = { catalogs, catalogFor, withLiveData };
