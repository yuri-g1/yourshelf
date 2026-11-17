const tmdb = require("./tmdb");
const igdb = require("./igdb");
const openlibrary = require("./openlibrary");
const deezer = require("./deezer");
const fanart = require("./fanart");
const albumart = require("./albumart");

const MOVIE_BATCH_SIZE = 10;

async function getMovies(externalIds) {
  const ids = [...new Set(externalIds)];
  const result = new Map();

  for (let i = 0; i < ids.length; i += MOVIE_BATCH_SIZE) {
    const batch = ids.slice(i, i + MOVIE_BATCH_SIZE);
    const movies = await Promise.allSettled(
      batch.map(async (id) => {
        const [movie, art] = await Promise.all([tmdb.getMovie(id), fanart.getMovieArt(id)]);
        return { ...movie, discArt: art.discArt, titleLogo: art.titleLogo || movie.titleLogo };
      }),
    );

    movies.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") result.set(batch[index], outcome.value);
    });
  }

  return result;
}

async function getAlbums(externalIds) {
  const albums = await deezer.getAlbums(externalIds);
  const discs = await albumart.discsFor([...albums.keys()]);

  for (const [id, album] of albums) {
    const record = discs.get(id);
    if (!record || albumart.isStale(record)) albumart.warm(album);
    albums.set(id, { ...album, discArt: record?.discArt || null, discCrop: record?.crop || null });
  }

  return albums;
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
    idPattern: /^\d{1,12}$/,
    details: tmdb.getMovieDetails,
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
    idPattern: /^\d{1,12}$/,
    details: igdb.getGameDetails,
    isSourceError: (error) => error instanceof igdb.IgdbError,
  },
  book: {
    field: "books",
    noun: "book",
    plural: "books",
    source: "Open Library",
    isConfigured: openlibrary.isConfigured,
    search: openlibrary.searchBooks,
    getMany: openlibrary.getBooks,
    describe: openlibrary.describeBook,
    idPattern: /^OL\d{1,12}W$/,
    details: openlibrary.getBookDetails,
    isSourceError: (error) => error instanceof openlibrary.OpenLibraryError,
  },
  album: {
    field: "albums",
    noun: "album",
    plural: "albums",
    source: "Deezer",
    isConfigured: deezer.isConfigured,
    search: deezer.searchAlbums,
    getMany: getAlbums,
    describe: deezer.describeAlbum,
    idPattern: /^\d{1,15}$/,
    details: deezer.getAlbumDetails,
    isSourceError: (error) => error instanceof deezer.DeezerError,
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
      creator: fresh.creator || item.creator,
      platform: fresh.platform || item.platform,
      discArt: fresh.discArt || null,
      discCrop: fresh.discCrop || null,
      titleLogo: fresh.titleLogo || null,
    };
  });
}

async function withDetails(catalog, fields) {
  if (!catalog.describe || !fields.externalId || fields.desc) return fields;

  try {
    return { ...fields, desc: await catalog.describe(fields.externalId) };
  } catch (error) {
    console.error(`${catalog.source} details failed:`, error.message);
    return fields;
  }
}

module.exports = { catalogs, catalogFor, withLiveData, withDetails };
