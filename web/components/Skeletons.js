"use client";

import Avatar from "@/components/Avatar";
import Bookcase from "@/components/Bookcase";
import { useSlow } from "@/lib/api";
import { useShape } from "@/lib/shape";

// Skeletons follow two rules so the page does not jump when data lands:
// 1. Fixed chrome (headings, labels) renders as real text, not bones.
// 2. Variable parts (how many items, rows, people) copy the shape remembered from the
//    last visit. With no memory yet they stay small (one shelf row) instead of guessing big.

const FIRST_VISIT_SLOTS = 8;
const TAB_WIDTHS = [68, 60, 56, 66];

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

// A plain function, not a component: Bookcase counts its direct children to work out
// rows and filler slots, so the slots must arrive as separate children, not one element.
export function shelfSlots(count = 6, kind = "movie") {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="shelf-skeleton" aria-hidden="true">
      {/* A real, closed plastic case with a blank cover, so loading looks like the shelf
          it turns into instead of grey boxes on the wood. */}
      <span className={`case case-${kind} plastic-black case-skeleton`}>
        <span className="skeleton-cover" style={{ "--i": index }} />
      </span>
      <span className="shelf-ledge" />
    </div>
  ));
}

export function ShelfSkeleton({ shapeKey }) {
  const shape = useShape(shapeKey);
  const known = shape && (shape.locked || shape.slots > 0);
  const slots = !known ? FIRST_VISIT_SLOTS : shape.locked ? 4 : shape.slots;
  const title = shape?.name ? (shape.own ? "Your shelf" : `${shape.name}'s shelf`) : null;

  return (
    <div aria-busy="true" aria-label="Loading shelf">
      <div className="profile">
        <div className="profile-id">
          {shape?.name ? <Avatar name={shape.name} size="lg" /> : <Bone className="sk-avatar sk-avatar-lg" />}
          <div>
            {title ? <h1>{title}</h1> : <Bone className="sk-title" />}
            <Bone className="sk-text" index={1} />
          </div>
        </div>
      </div>

      <Bookcase
        rows={known ? undefined : 1}
        crown={
          <div className="shelf-bar">
            {shape?.locked ? (
              <span />
            ) : (
              <div className="kind-switch sk-tabs">
                {TAB_WIDTHS.map((width, index) => (
                  <Bone key={index} className="sk-tab" index={index} width={width} />
                ))}
              </div>
            )}
            <Bone className="sk-visibility" index={4} />
          </div>
        }
      >
        {shelfSlots(slots)}
      </Bookcase>

      {shape?.more && (
        <div className="show-all" aria-hidden="true">
          <Bone className="sk-button" index={2} />
        </div>
      )}
      <SlowNote />
    </div>
  );
}

export function PersonCardSkeleton({ index = 0, footer = false }) {
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
      {footer && (
        <div className="person-footer">
          <Bone className="sk-button" index={index + 2} />
          <Bone className="sk-button sk-button-quiet" index={index + 3} />
        </div>
      )}
    </div>
  );
}

export function PeopleSkeleton({ count = 6, className = "people", footer = false }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading shelves">
      {Array.from({ length: count }, (_, index) => (
        <PersonCardSkeleton key={index} index={index} footer={footer} />
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 3, action = false }) {
  return (
    <div className="rows" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="row-item sk-row">
          <Bone className="sk-avatar sk-avatar-sm" index={index} />
          <div className="sk-grow">
            <Bone className="sk-name" index={index + 1} />
            <Bone className="sk-meta" index={index + 2} />
          </div>
          {action && <Bone className="sk-button sk-button-small" index={index + 3} />}
        </div>
      ))}
    </div>
  );
}

export function FriendsSkeleton() {
  const shape = useShape("friends");
  const friends = shape ? shape.friends : 2;
  const suggestions = shape ? shape.suggestions : 4;

  return (
    <div aria-busy="true" aria-label="Loading friends">
      {shape?.requests > 0 && (
        <section className="panel highlight requests" aria-hidden="true">
          <Bone className="sk-heading" />
          <Bone className="sk-text" index={1} />
          <div className="sk-gap">
            <RowsSkeleton count={shape.requests} action />
          </div>
        </section>
      )}

      <div className="friends-layout">
        <section>
          {friends > 0 ? (
            <PeopleSkeleton count={friends} className="people people-tight" footer />
          ) : (
            <div className="empty empty-cta" aria-hidden="true">
              <Bone className="sk-name sk-short" />
              <Bone className="sk-meta" index={1} />
              <Bone className="sk-meta sk-short" index={2} />
            </div>
          )}
        </section>

        <aside className="panel friends-aside">
          <h2>Add people</h2>
          <div className="field">
            <span className="field-label">Search by username</span>
            <Bone className="sk-field" index={1} />
          </div>
          {suggestions > 0 && (
            <>
              <Bone className="sk-meta sk-label" index={2} />
              <RowsSkeleton count={suggestions} action />
            </>
          )}
        </aside>
      </div>
      <SlowNote />
    </div>
  );
}
