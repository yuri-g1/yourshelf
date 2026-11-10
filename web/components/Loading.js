"use client";

import { useSlow } from "@/lib/api";

export default function Loading({ label = "Loading..." }) {
  const slow = useSlow(true);

  return (
    <div className="loading">
      <div className="movies">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <div className="skeleton skeleton-poster" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
      <p className="muted loading-label">
        {slow
          ? "Waking up the server. The free plan sleeps when idle, so this can take up to a minute."
          : label}
      </p>
    </div>
  );
}
