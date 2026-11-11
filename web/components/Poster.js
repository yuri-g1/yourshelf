import { kindOf } from "@/lib/kinds";
import { toneOf } from "@/lib/tone";

export default function Poster({ title, posterPath, kind }) {
  if (posterPath) {
    return (
      <img
        className="poster poster-image"
        src={kindOf(kind).image(posterPath)}
        alt={`Poster of ${title}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`poster poster-${toneOf(title)}`} aria-hidden="true">
      <span className="poster-mark">yourshelf</span>
      <span className="poster-title">{title}</span>
    </div>
  );
}
