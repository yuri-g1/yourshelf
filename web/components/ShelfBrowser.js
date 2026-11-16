"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import PersonCard, { totalOf } from "@/components/PersonCard";
import { PeopleSkeleton, SlowNote } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { rememberShape, useShape } from "@/lib/shape";

const SHOWN = 8;

export default function ShelfBrowser() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [people, setPeople] = useState(null);
  const [failed, setFailed] = useState(false);
  const shape = useShape("browse");

  // Real shelves are the only live data on the landing, so they load only once the
  // section is about to scroll into view (or the visitor jumped straight to it).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.location.hash === "#shelves") {
      node.scrollIntoView({ behavior: "instant" });
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let alive = true;

    api("/users")
      .then((list) => {
        if (!alive) return;
        const open = list
          .filter((user) => user.visibility === "public" && totalOf(user.preview) > 0)
          .sort((a, b) => totalOf(b.preview) - totalOf(a.preview));
        rememberShape("browse", { people: Math.min(open.length, SHOWN) });
        setPeople(open);
      })
      .catch(() => alive && setFailed(true));

    return () => {
      alive = false;
    };
  }, [near]);

  return (
    <section ref={ref} className="landing-browse" id="shelves" aria-labelledby="browse-title">
      <h2 id="browse-title">See what everyone else keeps on their shelves</h2>

      {failed ? (
        <div className="empty">
          <strong>Shelves could not load right now</strong>
          <span>Try again in a moment.</span>
        </div>
      ) : people === null ? (
        <>
          <PeopleSkeleton count={shape?.people || SHOWN} className="people people-four" />
          <SlowNote active={near} />
        </>
      ) : people.length === 0 ? (
        <div className="empty">
          <strong>No public shelves yet</strong>
          <span>Be the first to share yours.</span>
        </div>
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
