"use client";

import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { kindOf } from "@/lib/kinds";

export default function MovieSearch({ kind, onPick, onManual, autoFocus }) {
  const config = kindOf(kind);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [active, setActive] = useState(0);
  const list = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    let live = true;
    setStatus("loading");

    const timer = setTimeout(() => {
      api(`${config.searchPath}?q=${encodeURIComponent(term)}`)
        .then((found) => {
          if (!live) return;
          setResults(found);
          setActive(0);
          setStatus(found.length ? "done" : "empty");
        })
        .catch(() => live && setStatus("error"));
    }, 350);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, config.searchPath]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function pick(movie) {
    onPick(movie);
    setQuery("");
    setResults([]);
    setStatus("idle");
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && query) {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (results[active]) pick(results[active]);
      return;
    }

    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    }
  }

  const term = query.trim();
  const shape = config.square ? " is-square" : "";

  return (
    <div className="finder">
      <label htmlFor="movie-search" className="sr-only">
        Search for a {config.noun}
      </label>
      <div className="finder-box">
        <MagnifyingGlass className="finder-icon" size={20} weight="bold" aria-hidden="true" />
        <input
          id="movie-search"
          ref={input}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={config.placeholder}
          autoComplete="off"
          spellCheck="false"
          autoFocus={autoFocus}
          data-autofocus={autoFocus || undefined}
          aria-describedby="finder-status"
        />
        {query && (
          <button
            type="button"
            className="finder-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              input.current?.focus();
            }}
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>

      <p id="finder-status" className="sr-only" role="status">
        {status === "loading" && "Searching"}
        {status === "done" && `${results.length} results. Use the arrow keys and Enter to pick one.`}
        {status === "empty" && `No ${config.plural} found`}
        {status === "error" && "Search is unavailable"}
      </p>

      {status === "idle" && (
        <p className="finder-idle">
          Type at least two letters to search {config.source}.
        </p>
      )}

      {status === "loading" && (
        <ul className="finder-results" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li key={index} className="finder-row is-ghost" style={{ "--i": index }}>
              <span className={`finder-thumb${shape}`} />
              <span className="finder-lines">
                <span />
                <span />
              </span>
            </li>
          ))}
        </ul>
      )}

      {status === "done" && (
        <ul className="finder-results" ref={list}>
          {results.map((movie, index) => (
            <li key={movie.externalId}>
              <button
                type="button"
                data-index={index}
                className={`finder-row${index === active ? " is-active" : ""}`}
                onMouseMove={() => index !== active && setActive(index)}
                onClick={() => pick(movie)}
              >
                {movie.posterPath ? (
                  <img className={`finder-thumb${shape}`} src={config.image(movie.posterPath, "small")} alt="" loading="lazy" />
                ) : (
                  <span className={`finder-thumb${shape}`} />
                )}
                <span className="finder-text">
                  <strong>{movie.title}</strong>
                  <span className="finder-meta">
                    {[movie.year, movie.creator].filter(Boolean).join(", ") || config.source}
                  </span>
                </span>
                <span className="finder-add" aria-hidden="true">
                  <Plus size={16} weight="bold" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(status === "empty" || status === "error") && (
        <div className="finder-empty">
          <strong>
            {status === "empty"
              ? `Nothing on ${config.source} matches “${term}”`
              : `${config.source} is not answering right now`}
          </strong>
          <span>
            {status === "empty"
              ? "Home videos, indie releases and rarities fit on the shelf too. Add it yourself."
              : "You can still add it to the shelf yourself."}
          </span>
          <button type="button" className="btn btn-small btn-soft" onClick={() => onManual(term)}>
            Add “{term.length > 28 ? `${term.slice(0, 28)}...` : term}” by hand
          </button>
        </div>
      )}
    </div>
  );
}
