// Remembers the last rendered shape of a page (how many items, rows, people) so its
// skeleton can draw the same layout on the next visit instead of guessing.
// Stored per browser only; a missing or blocked storage just means a default skeleton.

import { useLayoutEffect, useState } from "react";

const PREFIX = "yourshelf:shape:";

// Reads after mount (before paint) so server and client render the same first frame.
export function useShape(key) {
  const [shape, setShape] = useState(null);

  useLayoutEffect(() => {
    setShape(recallShape(key));
  }, [key]);

  return shape;
}

export function recallShape(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function rememberShape(key, shape) {
  if (!key) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(shape));
  } catch {}
}

export function forgetShapes() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {}
}
