import { LockSimple } from "@phosphor-icons/react";

export default function AddTile({ label, source, kind = "movie", onClick, locked = false }) {
  const slot = (
    <>
      <span className={`case case-${kind} case-add`}>
        <span className="add-slot">
          <span className="add-plus" aria-hidden="true">
            {locked ? <LockSimple size={20} weight="bold" /> : "+"}
          </span>
          <span className="add-label">{label}</span>
        </span>
      </span>
      <span className="shelf-ledge" aria-hidden="true" />
    </>
  );

  if (locked) return <div className="movie add-tile is-locked">{slot}</div>;

  return (
    <button type="button" className="movie add-tile" onClick={onClick} aria-label={`${label}. Search ${source}`}>
      {slot}
    </button>
  );
}
