export default function AddTile({ label, onClick }) {
  return (
    <button type="button" className="movie add-tile" onClick={onClick}>
      <span className="add-tile-poster" aria-hidden="true">
        <span className="add-tile-plus">+</span>
      </span>
      <span className="movie-title">{label}</span>
      <span className="movie-meta">Search TMDB</span>
    </button>
  );
}
