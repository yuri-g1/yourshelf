import { toneOf } from "@/lib/tone";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

export default function Poster({ title, posterPath }) {
  if (posterPath) {
    return (
      <img
        className="poster poster-image"
        src={`${IMAGE_BASE}${posterPath}`}
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
