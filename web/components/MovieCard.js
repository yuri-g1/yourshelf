"use client";

import { useCallback, useState } from "react";
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
            <Disc art={art} discArt={movie.discArt} />
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
          <Poster title={movie.title} posterPath={movie.posterPath} src={movie.cover} kind={kind} />
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

// The case never opens onto an empty tray: a disc printed with the cover art (already
// loaded for the cover itself) is always there, and the real disc art fades in over it
// once it has downloaded.
function Disc({ art, discArt }) {
  const [loaded, setLoaded] = useState(false);
  const watch = useCallback((img) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <>
      <span
        className={`disc${loaded ? " is-covered" : ""}`}
        style={art ? { "--art": `url("${art}")` } : undefined}
      />
      {discArt && (
        <img
          ref={watch}
          className={`disc disc-art${loaded ? " is-loaded" : ""}`}
          src={discArt}
          alt=""
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
        />
      )}
    </>
  );
}
