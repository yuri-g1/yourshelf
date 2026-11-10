"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w92";

export default function MovieSearch({ onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    let active = true;
    setStatus("loading");

    const timer = setTimeout(() => {
      api(`/movies/search?q=${encodeURIComponent(term)}`)
        .then((list) => {
          if (!active) return;
          setResults(list);
          setStatus(list.length ? "done" : "empty");
        })
        .catch(() => active && setStatus("error"));
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  function pick(movie) {
    onPick(movie);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  return (
    <div className="field">
      <label htmlFor="movie-search">Search TMDB</label>
      <input
        id="movie-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Type a movie name"
        autoComplete="off"
      />

      {status === "loading" && <span className="field-hint">Searching...</span>}
      {status === "empty" && <span className="field-hint">No movies found. You can still type it below.</span>}
      {status === "error" && (
        <span className="field-hint">Search is unavailable right now. You can still type it below.</span>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((movie) => (
            <li key={movie.externalId}>
              <button type="button" className="search-result" onClick={() => pick(movie)}>
                {movie.posterPath ? (
                  <img src={`${IMAGE_BASE}${movie.posterPath}`} alt="" loading="lazy" />
                ) : (
                  <span className="search-result-blank" />
                )}
                <span>
                  <strong>{movie.title}</strong>
                  {movie.year && <span className="muted"> ({movie.year})</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
