export function toneOf(text, variants = 4) {
  let hash = 0;

  for (const char of text || "") {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % variants;
}
