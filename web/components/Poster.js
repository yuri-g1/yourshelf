import { kindOf } from "@/lib/kinds";
import { toneOf } from "@/lib/tone";

export default function Poster({ title, posterPath, src, kind }) {
  const shape = kindOf(kind).square ? " poster-square" : "";
  const image = src || (posterPath ? kindOf(kind).image(posterPath) : null);

  if (image) {
    return (
      <img
        className={`poster poster-image${shape}`}
        src={image}
        alt={`${kind && kind !== "movie" ? "Cover" : "Poster"} of ${title}`}
        loading="lazy"
      />
    );
  }

  const label = title?.trim() || "Untitled";

  return (
    <div className={`poster poster-blank poster-${toneOf(label)}${shape}`} aria-hidden="true">
      <span className="poster-label-title">{label}</span>
    </div>
  );
}
