import { toneOf } from "@/lib/tone";

export default function Avatar({ name, size }) {
  const sizeClass = size ? `avatar-${size}` : "";

  return (
    <span
      className={`avatar avatar-${toneOf(name)} ${sizeClass}`}
      aria-hidden="true"
    >
      {name?.[0]?.toUpperCase() || "?"}
    </span>
  );
}
