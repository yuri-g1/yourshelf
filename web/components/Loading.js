"use client";

import Bookcase from "@/components/Bookcase";
import { useSlow } from "@/lib/api";

export default function Loading({ label = "Loading..." }) {
  const slow = useSlow(true);

  return (
    <div className="loading">
      <Bookcase>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="shelf-skeleton">
            <span className="case case-empty">
              <div className="skeleton skeleton-poster" />
            </span>
            <span className="shelf-ledge" />
          </div>
        ))}
      </Bookcase>
      <p className="muted loading-label">
        {slow
          ? "Waking up the server. The free plan sleeps when idle, so this can take up to a minute."
          : label}
      </p>
    </div>
  );
}
