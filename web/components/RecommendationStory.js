"use client";

import { useEffect, useRef, useState } from "react";
import Bookcase from "@/components/Bookcase";
import MovieCard from "@/components/MovieCard";
import { ShelfSlots } from "@/components/Skeletons";
import { kindOf } from "@/lib/kinds";

// The pitch next to one real example: a friend's recommendation standing on
// someone's shelf between their own picks. When the section scrolls into
// view the recommended case drops into its gap, which is the whole idea of
// the app in one motion.
export default function RecommendationStory({ note, onOpen }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !note) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [note]);

  if (note === false) return null;

  const config = kindOf(note?.kind);
  const items = note ? [note.neighbors[0], note, note.neighbors[1]].filter(Boolean) : [];

  return (
    <section ref={ref} className={`story${seen ? " is-seen" : ""}`} aria-labelledby="story-title">
      <div className="story-copy">
        <h2 id="story-title">Friends put things on your shelf.</h2>
        <p>
          Add a friend and they can leave a movie, game, book or album on your shelf with a short note. It
          stands next to your own picks, marked with their name.
        </p>
      </div>

      <div className="story-shelf">
        <Bookcase kind={note?.kind || "movie"} square={config.square}>
          {note ? (
            items.map((item) => (
              <MovieCard
                key={item._id}
                movie={item}
                kind={note.kind}
                className={item === note ? "story-landing" : ""}
                onOpen={() => onOpen(note.owner._id)}
              />
            ))
          ) : (
            <ShelfSlots count={3} />
          )}
        </Bookcase>
        {note && (
          <p className="story-caption">
            {note.recommendedBy.name} recommended the middle one to {note.owner.name}
          </p>
        )}
      </div>
    </section>
  );
}
