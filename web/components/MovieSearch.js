"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w92";

export default function MovieSearch({ onPick, autoFocus }) {
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
      <label htmlFor="movie-search">Search for a movie</label>
      <input
        id="movie-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && setQuery("")}
        placeholder="The Matrix, Spirited Away..."
        autoComplete="off"
        data-autofocus={autoFocus || undefined}
      />

      <span className="field-hint" role="status">
        {status === "loading" && "Searching..."}
        {status === "empty" && "No movies found. You can add it yourself."}
        {status === "error" && "Search is unavailable right now. You can add it yourself."}
      </span>

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
