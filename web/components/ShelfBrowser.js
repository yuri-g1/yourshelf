"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import PersonCard from "@/components/PersonCard";
import { PeopleSkeleton } from "@/components/Skeletons";

// two rows of four on desktop
const SHOWN = 8;

// The fullest public shelves (people arrives already sorted), then the
// invitation to make your own.
// `settled` turns true once everything above this section has loaded, so a
// jump to #shelves lands in the right place instead of shifting afterwards
export default function ShelfBrowser({ people, failed, settled }) {
  const ref = useRef(null);
  const jumped = useRef(false);

  // the page is drawn after load, so the browser misses a #shelves link
  // (old /explore links land here); jump to the section ourselves
  useEffect(() => {
    if (!settled || jumped.current || window.location.hash !== "#shelves") return;
    jumped.current = true;
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "instant" }));
  }, [settled]);

  return (
    <section ref={ref} className="landing-browse" id="shelves" aria-labelledby="browse-title">
      <h2 id="browse-title">See what everyone else keeps on their shelves</h2>

      {failed && !people ? (
        <div className="empty">
          <strong>Shelves could not load right now</strong>
          <span>Try again in a moment.</span>
        </div>
      ) : people === null ? (
        <PeopleSkeleton count={SHOWN} className="people people-four" />
      ) : (
        <div className="people people-four">
          {people.slice(0, SHOWN).map((user) => (
            <PersonCard key={user._id} user={user} />
          ))}
        </div>
      )}

      <div className="browse-cta">
        <Link href="/signup" className="btn">
          Create yours and share it with your friends
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
