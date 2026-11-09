import { toneOf } from "@/lib/tone";

export default function Poster({ title }) {
  return (
    <div className={`poster poster-${toneOf(title)}`} aria-hidden="true">
      <span className="poster-mark">yourshelf</span>
      <span className="poster-title">{title}</span>
    </div>
  );
}
