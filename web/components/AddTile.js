// The add slot: an empty, clear case standing on the shelf with the app's
// lavender plus in it. Same size as the cases around it.
export default function AddTile({ label, source, kind = "movie", onClick }) {
  return (
    <button
      type="button"
      className="movie add-tile"
      onClick={onClick}
      aria-label={`${label}. Search ${source}`}
    >
      <span className={`case case-${kind} case-add`}>
        <span className="add-slot">
          <span className="add-plus" aria-hidden="true">+</span>
          <span className="add-label">{label}</span>
        </span>
      </span>
      <span className="shelf-ledge" aria-hidden="true" />
    </button>
  );
}
