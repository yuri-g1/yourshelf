"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Bookcase from "@/components/Bookcase";
import MovieCard from "@/components/MovieCard";
import ShelfBrowser from "@/components/ShelfBrowser";
import RecommendationStory from "@/components/RecommendationStory";
import { LANDING_STORY, LANDING_WALL } from "@/lib/landing";

function browse() {
  document.getElementById("shelves")?.scrollIntoView({ behavior: "smooth" });
}

export default function Landing() {
  const [closed, setClosed] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--scrollbar", `${window.innerWidth - root.clientWidth}px`);
    const observer = new ResizeObserver(measure);

    measure();
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-copy reveal">
          <h1 className="landing-title">Everything you love, on one shelf.</h1>
          <p className="landing-sub">
            Movies, games, books and albums side by side. Friends leave their recommendations right on it.
          </p>
          <div className="landing-ctas">
            <Link href="/signup" className="btn">
              Create your shelf
            </Link>
            <a href="#shelves" className="btn btn-ghost">
              Browse shelves
            </a>
          </div>
        </div>
      </section>

      <section className="landing-wall reveal reveal-2" aria-label="A shelf of movies, games and albums">
        <Bookcase rows={1} className="bookcase-bleed bookcase-open">
          {LANDING_WALL.map((item) => (
            <MovieCard
              key={item._id}
              movie={item}
              kind={item.kind}
              state={closed === item._id ? "closed" : undefined}
              onOpen={() => {
                const touch = !window.matchMedia("(hover: hover)").matches;
                if (touch && closed !== item._id) return setClosed(item._id);
                browse();
              }}
            />
          ))}
        </Bookcase>
      </section>

      <RecommendationStory note={LANDING_STORY} onOpen={browse} />

      <ShelfBrowser />
    </div>
  );
}
