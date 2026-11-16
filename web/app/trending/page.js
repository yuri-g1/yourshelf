"use client";

import { useCallback, useEffect, useState } from "react";
import Bookcase from "@/components/Bookcase";
import MarkTrack from "@/components/MarkTrack";
import MovieCard from "@/components/MovieCard";
import MovieDetail from "@/components/MovieDetail";
import Poster from "@/components/Poster";
import { useApi } from "@/lib/api";
import { KIND_LIST, kindOf } from "@/lib/kinds";

function timeUntil(date) {
  const hours = Math.max(1, Math.round((new Date(date) - Date.now()) / 3600000));
  if (hours < 48) return hours === 1 ? "in about an hour" : `in about ${hours} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

function weekNumber(key) {
  return Number(key.split("-w")[1]);
}

function shelvesLine(count) {
  return count === 1 ? "On 1 shelf" : `On ${count} shelves`;
}

function StatusLine({ data }) {
  if (!data.trending) {
    return <p className="trending-status">The first list comes out {timeUntil(data.nextRefreshAt)}.</p>;
  }

  const week = weekNumber(data.trending.key);

  if (!data.isCurrentWeek) {
    return (
      <p className="trending-status">
        Showing week {week}. This week&apos;s list comes out {timeUntil(data.nextRefreshAt)}.
      </p>
    );
  }

  return (
    <p className="trending-status">
      Week {week}, next update {timeUntil(data.nextRefreshAt)}.
    </p>
  );
}

function Podium({ item, kind, onOpen }) {
  const config = kindOf(kind);

  return (
    <section className="trending-podium" aria-label={`Most added ${config.noun} this week`}>
      <div className="trending-podium-case">
        <Bookcase rows={1} kind={kind} square={config.square}>
          <MovieCard movie={item} kind={kind} onOpen={onOpen} />
        </Bookcase>
      </div>
      <div className="trending-podium-text">
        <span className="trending-podium-rank" aria-hidden="true">
          1
        </span>
        <p className="trending-podium-label">Most added {config.noun} this week</p>
        <h2>{item.title}</h2>
        {item.creator && <p className="trending-podium-creator">by {item.creator}</p>}
        <p className="trending-podium-count">{shelvesLine(item.count)}</p>
      </div>
    </section>
  );
}

function Ranking({ items, kind, onOpen }) {
  return (
    <ol className="trending-ranking" start={2} style={{ "--rows": Math.ceil(items.length / 2) }}>
      {items.map((item, index) => (
        <li key={item.externalId}>
          <button type="button" className="trending-row" onClick={() => onOpen(item)}>
            <span className="trending-rank" aria-hidden="true">
              {index + 2}
            </span>
            <span className="trending-row-poster">
              <Poster title={item.title} posterPath={item.posterPath} kind={kind} />
            </span>
            <span className="trending-row-text">
              <strong>{item.title}</strong>
              {item.creator && <span>{item.creator}</span>}
              <small>{shelvesLine(item.count)}</small>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function TrendingSkeleton() {
  return (
    <div className="trending-skeleton" aria-busy="true" aria-label="Loading trending">
      <div className="trending-podium">
        <span className="skeleton trending-skeleton-case" />
        <div className="trending-podium-text">
          <span className="skeleton sk-title" />
          <span className="skeleton sk-text" />
        </div>
      </div>
      <div className="trending-ranking">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className="skeleton trending-skeleton-row" style={{ "--i": index }} />
        ))}
      </div>
    </div>
  );
}

export default function TrendingPage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("movie");
  const [selected, setSelected] = useState(null);

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

  const items = data?.trending?.top?.[kind] ?? [];
  const config = kindOf(kind);

  return (
    <>
      <div className="reveal">
        <h1 className="page-title">Trending</h1>
        {data ? (
          <StatusLine data={data} />
        ) : (
          <p className="trending-status">The most added picks across every shelf this week.</p>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}{" "}
          <button type="button" className="text-link" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!data && !error && <TrendingSkeleton />}

      {data?.trending && (
        <>
          <MarkTrack className="kind-switch trending-switch" role="group" aria-label="Trending type" watch={kind}>
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
            <div className="empty trending-empty">
              <strong>No {config.plural} this week</strong>
              <span>Nobody added a {config.noun} in the last 7 days. The next list could start with yours.</span>
            </div>
          ) : (
            <div key={kind} className="trending-board reveal reveal-2">
              <Podium item={items[0]} kind={kind} onOpen={setSelected} />
              {items.length > 1 && <Ranking items={items.slice(1)} kind={kind} onOpen={setSelected} />}
            </div>
          )}
        </>
      )}

      <MovieDetail movie={selected} kind={kind} onClose={() => setSelected(null)} />
    </>
  );
}
