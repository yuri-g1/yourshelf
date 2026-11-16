export function safeNext(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  if (raw.startsWith("/login") || raw.startsWith("/signup")) return "/";
  return raw;
}

export function authHref(mode, from) {
  const base = mode === "signup" ? "/signup" : "/login";
  const next = safeNext(from);
  return next === "/" ? base : `${base}?next=${encodeURIComponent(next)}`;
}
