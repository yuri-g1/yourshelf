"use client";

import Bookcase from "@/components/Bookcase";
import { useSlow } from "@/lib/api";

export function SlowNote({ active = true }) {
  const slow = useSlow(active);

  return (
    <p className="slow-note" role="status" aria-live="polite">
      {slow ? "Waking up the server. The free plan sleeps when idle, so this can take up to a minute." : ""}
    </p>
  );
}

function Bone({ className = "", index = 0, width }) {
  return <span className={`skeleton ${className}`} style={{ "--i": index, width }} aria-hidden="true" />;
}

export function ShelfSlots({ count = 6, kind = "movie" }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="shelf-skeleton" aria-hidden="true">
      <span className={`case case-${kind} case-empty`}>
        <Bone className="skeleton-poster" index={index} />
      </span>
      <span className="shelf-ledge" />
    </div>
  ));
}

export function ShelfSkeleton({ slots = 8 }) {
  return (
    <div aria-busy="true" aria-label="Loading shelf">
      <div className="profile">
        <div className="profile-id">
          <Bone className="sk-avatar sk-avatar-lg" />
          <div>
            <Bone className="sk-title" />
            <Bone className="sk-text" index={1} />
          </div>
        </div>
      </div>

      <Bookcase
        crown={
          <div className="shelf-bar sk-tabs">
            {[72, 64, 60, 70].map((width, index) => (
              <Bone key={index} className="sk-tab" index={index} width={width} />
            ))}
          </div>
        }
      >
        <ShelfSlots count={slots} />
      </Bookcase>
      <SlowNote />
    </div>
  );
}

export function PersonCardSkeleton({ index = 0 }) {
  return (
    <div className="person-card person-preview sk-card" aria-hidden="true">
      <div className="person-head">
        <Bone className="sk-avatar" index={index} />
        <div className="sk-grow">
          <Bone className="sk-name" index={index} />
          <Bone className="sk-meta" index={index + 1} />
        </div>
      </div>
      <div className="person-posters">
        {[0, 1, 2, 3].map((slot) => (
          <Bone key={slot} className="sk-cover" index={index + slot} />
        ))}
      </div>
    </div>
  );
}

export function PeopleSkeleton({ count = 6, className = "people" }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading shelves">
      {Array.from({ length: count }, (_, index) => (
        <PersonCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 3 }) {
  return (
    <div className="rows" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="row-item sk-row">
          <Bone className="sk-avatar" index={index} />
          <Bone className="sk-name" index={index + 1} />
        </div>
      ))}
    </div>
  );
}

export function FriendsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading friends">
      <div className="friends-layout">
        <div className="stack">
          <PeopleSkeleton count={4} className="people people-tight" />
        </div>
        <aside className="panel friends-aside">
          <Bone className="sk-name" />
          <Bone className="sk-input" index={1} />
          <RowsSkeleton count={4} />
        </aside>
      </div>
      <SlowNote />
    </div>
  );
}
