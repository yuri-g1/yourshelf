export const KINDS = {
  movie: {
    key: "movie",
    noun: "movie",
    plural: "movies",
    label: "Movies",
    source: "TMDB",
    searchPath: "/movies/search",
    placeholder: "The Matrix, Spirited Away...",
    descLabel: "Synopsis",
    verb: "watch",
    link: (id) => `https://www.themoviedb.org/movie/${id}`,
    image: (path, size) => `https://image.tmdb.org/t/p/${size === "small" ? "w92" : "w342"}${path}`,
  },
  game: {
    key: "game",
    noun: "game",
    plural: "games",
    label: "Games",
    source: "IGDB",
    searchPath: "/games/search",
    placeholder: "Hades, Celeste...",
    descLabel: "Summary",
    verb: "play",
    image: (path, size) =>
      `https://images.igdb.com/igdb/image/upload/${size === "small" ? "t_thumb" : "t_cover_big"}/${path}.jpg`,
  },
  book: {
    key: "book",
    noun: "book",
    plural: "books",
    label: "Books",
    source: "Open Library",
    searchPath: "/books/search",
    placeholder: "Dune, Pride and Prejudice...",
    descLabel: "Synopsis",
    creatorLabel: "Author",
    verb: "read",
    link: (id) => `https://openlibrary.org/works/${id}`,
    image: (path, size) => `https://covers.openlibrary.org/b/id/${path}-${size === "small" ? "S" : "L"}.jpg`,
  },
  album: {
    key: "album",
    noun: "album",
    plural: "albums",
    label: "Albums",
    source: "Deezer",
    searchPath: "/albums/search",
    placeholder: "OK Computer, Blonde...",
    descLabel: "About",
    creatorLabel: "Artist",
    verb: "listen to",
    link: (id) => `https://www.deezer.com/album/${id}`,
    square: true,
    image: (path, size) =>
      `https://cdn-images.dzcdn.net/images/cover/${path}/${size === "small" ? "120x120" : "500x500"}-000000-80-0-0.jpg`,
  },
};

export const KIND_LIST = Object.values(KINDS);

export function kindOf(key) {
  return KINDS[key] || KINDS.movie;
}

export function mediaHref(kind, externalId) {
  return `/${kindOf(kind).key}/${encodeURIComponent(externalId)}`;
}
