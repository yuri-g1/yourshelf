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
};

export const KIND_LIST = Object.values(KINDS);

export function kindOf(key) {
  return KINDS[key] || KINDS.movie;
}
