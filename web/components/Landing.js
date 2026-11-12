"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Bookcase from "@/components/Bookcase";
import MovieCard from "@/components/MovieCard";
import { totalOf } from "@/components/PersonCard";
import ShelfBrowser from "@/components/ShelfBrowser";
import RecommendationStory from "@/components/RecommendationStory";
import { ShelfSlots, SlowNote } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { caseFor } from "@/lib/platforms";

// One shelf that runs the full width of the screen, every case standing
// open, with movies, games and albums taken in turn. Each kind starts with
// the public shelf that has the most of it and tops up from the next ones.
const KINDS = ["movie", "game", "album"];
const PER_SHELF = 10;
// enough for one row on a very wide screen; Bookcase trims to what fits
const MIXED = 20;

// own picks with a couple of friends' recommendations mixed in, so the
// lavender "Recommended" band shows up on the wall
function mix(media, owner) {
  const recommended = media.recommended.slice(0, 2);
  const items = [...media.myShelf];

  recommended.forEach((item, index) => items.splice(Math.min(1 + index * 3, items.length), 0, item));
  return items.map((item) => ({ ...item, owner }));
}

function shelfFor(kind, shelves) {
  const ranked = [...shelves].sort(
    (a, b) =>
      b[kind].myShelf.length + b[kind].recommended.length -
      (a[kind].myShelf.length + a[kind].recommended.length),
  );
  const all = ranked.flatMap((shelf) => mix(shelf[kind], shelf.owner));
  const items = (kind === "game" ? byConsole(all) : all)
    .slice(0, PER_SHELF)
    .map((item) => ({ ...item, kind }));

  return { kind, items };
}

// A game without a known platform sits in a plain black case that looks
// just like a movie, so games in console cases go first, alternating
// PlayStation, Switch and Xbox, and the plain ones come last.
function byConsole(games) {
  const families = new Map();

  games.forEach((game) => {
    const family = caseFor(game.platform).family;
    if (!families.has(family)) families.set(family, []);
    families.get(family).push(game);
  });

  const plain = families.get("black") || [];
  families.delete("black");

  const groups = [...families.values()];
  const ordered = [];
  for (let index = 0; groups.some((group) => group[index]); index += 1) {
    groups.forEach((group) => group[index] && ordered.push(group[index]));
  }

  return [...ordered, ...plain];
}

// movie, game, album, movie, game... taken in turn from each kind
function mixedShelf(byKind) {
  const items = [];

  for (let index = 0; items.length < MIXED && byKind.some((shelf) => shelf.items[index]); index += 1) {
    byKind.forEach((shelf) => shelf.items[index] && items.push(shelf.items[index]));
  }

  return items.slice(0, MIXED);
}

export default function Landing() {
  const router = useRouter();
  const [people, setPeople] = useState(null);
  const [wall, setWall] = useState(null);
  const [note, setNote] = useState(null);
  const [failed, setFailed] = useState(false);
  // touch screens have no hover: the first tap closes a case to show its
  // cover, a second tap on that cover opens the owner's shelf
  const [closed, setClosed] = useState(null);

  // 100vw counts the scrollbar; the full-width shelf subtracts it so it
  // reaches both edges exactly
  useEffect(() => {
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--scrollbar", `${window.innerWidth - root.clientWidth}px`);
    const observer = new ResizeObserver(measure);

    measure();
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;

    api("/users")
      .then(async (list) => {
        const open = list
          .filter((user) => user.visibility === "public" && totalOf(user.preview) > 0)
          .sort((a, b) => totalOf(b.preview) - totalOf(a.preview));

        if (!alive) return;
        setPeople(open);

        const shelves = (
          await Promise.all(open.map((user) => api(`/shelf/${user._id}`).catch(() => null)))
        ).filter(Boolean);
        if (!alive) return;

        const byKind = KINDS.map((kind) => shelfFor(kind, shelves)).filter((shelf) => shelf.items.length > 0);
        setWall(mixedShelf(byKind));

        const found = shelves
          .flatMap((shelf) =>
            KINDS.flatMap((kind) => shelf[kind].recommended.map((pick) => ({ ...pick, kind, owner: shelf.owner }))),
          )
          .find((pick) => pick.recommendationText && pick.recommendedBy);
        if (!found) return setNote(false);
        // the two picks that stood next to it on the owner's shelf
        const home = shelves.find((shelf) => shelf.owner._id === found.owner._id);
        setNote({ ...found, neighbors: home[found.kind].myShelf.slice(0, 2) });
      })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        setNote(false);
      });

    return () => {
      alive = false;
    };
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

      <section className="landing-wall reveal reveal-2" aria-label="Shelves from people on yourshelf">
        <Bookcase rows={1} className="bookcase-bleed bookcase-open">
          {wall ? (
            wall.map((item) => (
              <MovieCard
                key={item._id}
                movie={item}
                kind={item.kind}
                state={closed === item._id ? "closed" : undefined}
                onOpen={() => {
                  const touch = !window.matchMedia("(hover: hover)").matches;
                  if (touch && closed !== item._id) return setClosed(item._id);
                  router.push(`/shelf/${item.owner._id}`);
                }}
              />
            ))
          ) : (
            <ShelfSlots count={failed ? 0 : MIXED} />
          )}
        </Bookcase>
        {!wall && !failed && <SlowNote />}
      </section>

      <RecommendationStory note={note} onOpen={(id) => router.push(`/shelf/${id}`)} />

      <ShelfBrowser people={people} failed={failed} settled={failed || (wall !== null && note !== null)} />

    </div>
  );
}

