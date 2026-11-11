export default function AddTile({ label, source, square, onClick }) {
  return (
    <button type="button" className="movie add-tile" onClick={onClick}>
      <span className={`add-tile-poster${square ? " poster-square" : ""}`} aria-hidden="true">
        <span className="add-tile-plus">+</span>
      </span>
      <span className="movie-title">{label}</span>
      <span className="movie-meta">Search {source}</span>
    </button>
  );
}
