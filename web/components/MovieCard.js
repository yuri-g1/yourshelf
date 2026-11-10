import Poster from "@/components/Poster";

export default function MovieCard({ movie, onOpen }) {
  const recommender = movie.recommendedBy;

  return (
    <button type="button" className="movie" onClick={() => onOpen(movie)}>
      <Poster title={movie.title} posterPath={movie.posterPath} />
      <span className="movie-title">{movie.title}</span>
      <span className="movie-meta">
        {recommender ? `from ${recommender.name}` : movie.year || "Your pick"}
      </span>
    </button>
  );
}
