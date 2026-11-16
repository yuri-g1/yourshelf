"use client";

import { useCallback, useEffect, useState } from "react";
import MarkTrack from "@/components/MarkTrack";
import Poster from "@/components/Poster";
import { useApi } from "@/lib/api";
import { KIND_LIST, kindOf } from "@/lib/kinds";

function timeUntil(date) {
  const hours = Math.max(1, Math.round((new Date(date) - Date.now()) / 3600000));
  if (hours < 48) return hours === 1 ? "in about an hour" : `in about ${hours} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

export default function TrendingPage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("movie");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api("/trending"));
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const trending = data?.trending;
  const items = trending?.top?.[kind] ?? [];
  const config = kindOf(kind);

  return (
    <>
      <div className="reveal">
        <h1 className="page-title">Trending</h1>
        <p className="page-sub">The most added picks across every shelf in the last 7 days.</p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}{" "}
          <button type="button" className="text-link" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!data && !error && <p className="muted">Loading trending...</p>}

      {data && !trending && (
        <div className="alert alert-info" role="status">
          The first trending list comes out {timeUntil(data.nextRefreshAt)}.
        </div>
      )}

      {trending && (
        <>
          {!data.isCurrentWeek && (
            <div className="alert alert-info" role="status">
              This week&apos;s trending comes out {timeUntil(data.nextRefreshAt)}. Showing last week&apos;s list.
            </div>
          )}

          <MarkTrack className="kind-switch" role="group" aria-label="Trending type" watch={kind}>
            {KIND_LIST.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={kind === item.key}
                className={kind === item.key ? "active" : ""}
                onClick={() => setKind(item.key)}
              >
                {item.label}
              </button>
            ))}
          </MarkTrack>

          {items.length === 0 ? (
            <p className="muted trending-empty">No {config.plural} were added this week.</p>
          ) : (
            <ol className="trending-list">
              {items.map((item, index) => (
                <li key={item.externalId} className="trending-item">
                  <span className="trending-rank">{index + 1}</span>
                  <div className="trending-poster">
                    <Poster title={item.title} posterPath={item.posterPath} kind={kind} />
                  </div>
                  <div className="trending-text">
                    <strong>{item.title}</strong>
                    {item.creator && <span className="muted">{item.creator}</span>}
                    <small className="muted">
                      On {item.count === 1 ? "1 shelf" : `${item.count} shelves`}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </>
  );
}
