"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import Poster from "@/components/Poster";
import { kindOf } from "@/lib/kinds";
import { caseFor } from "@/lib/platforms";

export default function MovieCard({ movie, kind = "movie", onOpen, state, className = "" }) {
  const recommender = movie.recommendedBy;
  const art = movie.cover || (movie.posterPath ? kindOf(kind).image(movie.posterPath) : null);
  const platform = kind === "game" ? caseFor(movie.platform) : kind === "movie" ? { family: "black" } : null;
  const plastic =
    (platform ? ` plastic-${platform.family}` : "") + (platform?.logo ? ` label-${platform.label}` : "");
  const label = recommender ? `${movie.title}, recommended by ${recommender.name}` : movie.title;

  return (
    <button
      type="button"
      className={`movie${recommender ? " movie-recommended" : ""}${state ? ` is-${state}` : ""}${className ? ` ${className}` : ""}`}
      onClick={() => onOpen(movie)}
      aria-label={label}
    >
      <span className={`case case-${kind}${plastic}`}>
        <span className="case-inside" aria-hidden="true">
          {kind === "book" ? (
            <span className="book-page" />
          ) : platform?.family === "switch" ? (
            <span className="cartridge" style={art ? { "--art": `url("${art}")` } : undefined} />
          ) : (
            <Disc key={movie.discArt || "none"} art={art} discArt={movie.discArt} />
          )}
        </span>
        <span className="cover">
          {platform?.logo && platform.label === "band" && (
            <span className={`cover-platform band-${platform.mark}`} aria-hidden="true">
              <img src={platform.logo} alt="" />
            </span>
          )}
          {platform?.logo && platform.label === "corner" && (
            <img className={`cover-corner corner-${platform.mark}`} src={platform.logo} alt="" aria-hidden="true" />
          )}
          <Poster
            title={movie.title}
            posterPath={movie.posterPath}
            src={movie.cover}
            kind={kind}
          />
          {recommender && (
            <span className="cover-band" aria-hidden="true">
              <span>Recommended</span>
              <Avatar name={recommender.name} size="xs" />
            </span>
          )}
        </span>
      </span>
      <span className="shelf-ledge" aria-hidden="true" />
    </button>
  );
}

const SPIN_MS = 900;
const DEG_PER_MS = 360 / SPIN_MS;

function Disc({ art, discArt }) {
  const [state, setState] = useState(discArt ? "loading" : "none");
  const spin = useRef(null);
  const img = useRef(null);
  const motion = useRef(null);

  useLayoutEffect(() => {
    const wheel = spin.current;
    const picture = img.current;
    if (!wheel || !picture) return;

    if (picture.complete && picture.naturalWidth > 0) {
      setState("loaded");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    motion.current = wheel.animate([{ rotate: "0deg" }, { rotate: "360deg" }], {
      duration: SPIN_MS,
      iterations: Infinity,
    });

    return () => motion.current?.cancel();
  }, []);

  function settle(next) {
    setState(next);
    const running = motion.current;
    const wheel = spin.current;
    if (!running || !wheel) return;

    const angle = (((running.currentTime ?? 0) % SPIN_MS) / SPIN_MS) * 360;
    running.cancel();

    let travel = 360 - angle;
    if (travel < 180) travel += 360;

    motion.current = wheel.animate(
      [{ rotate: `${angle}deg` }, { rotate: `${angle + travel}deg` }],
      { duration: (2 * travel) / DEG_PER_MS, easing: "cubic-bezier(0.5, 1, 0.89, 1)", fill: "forwards" },
    );
  }

  const blank = state === "loading";

  return (
    <span className="disc-spin" ref={spin}>
      <span
        className={`disc${blank ? " is-blank" : ""}${state === "loaded" ? " is-covered" : ""}`}
        style={art && !blank ? { "--art": `url("${art}")` } : undefined}
      />
      {discArt && state !== "failed" && (
        <img
          ref={img}
          className={`disc disc-art${state === "loaded" ? " is-loaded" : ""}`}
          src={discArt}
          alt=""
          decoding="async"
          fetchPriority="low"
          onLoad={() => settle("loaded")}
          onError={() => settle("failed")}
        />
      )}
    </span>
  );
}
