"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import PersonCard from "@/components/PersonCard";
import { LANDING_PEOPLE } from "@/lib/landingPeople";

export default function ShelfBrowser() {
  const ref = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#shelves") ref.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <section ref={ref} className="landing-browse" id="shelves" aria-labelledby="browse-title">
      <h2 id="browse-title">See what everyone else keeps on their shelves</h2>

      <div className="people people-four">
        {LANDING_PEOPLE.map((user) => (
          <PersonCard key={user._id} user={user} />
        ))}
      </div>

      <div className="browse-cta">
        <Link href="/signup" className="btn">
          Create yours and share it with your friends
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
