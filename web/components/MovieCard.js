import Link from "next/link";
import Avatar from "@/components/Avatar";
import Poster from "@/components/Poster";

export default function MovieCard({ movie, recommender, recommenderHref, canRemove, onRemove }) {
  return (
    <article className="movie">
      <Poster title={movie.title} />
      <h3>{movie.title}</h3>

      {recommender && (
        <div className="movie-from">
          <Avatar name={recommender.name} size="sm" />
          <span>
            from <Link href={recommenderHref}>{recommender.name}</Link>
          </span>
        </div>
      )}

      {movie.recommendationText && (
        <p className="note">“{movie.recommendationText}”</p>
      )}

      {movie.desc && <p className="movie-desc">{movie.desc}</p>}

      {canRemove && (
        <button className="text-link movie-remove" onClick={() => onRemove(movie)}>
          Remove
        </button>
      )}
    </article>
  );
}
