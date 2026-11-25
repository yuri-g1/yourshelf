"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
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

function Spotlight({ item, kind, onOpen }) {
  const config = kindOf(kind);

  return (
    <section className="trending-hero" aria-label={`Most added ${config.noun} this week`}>
      <div className="trending-hero-art">
        <span className="trending-tile-rank trending-hero-rank" aria-hidden="true">
          1
        </span>
        <div className="trending-hero-case">
          <Bookcase rows={1} kind={kind} square={config.square}>
            <MovieCard movie={item} kind={kind} onOpen={onOpen} />
          </Bookcase>
        </div>
      </div>
      <div className="trending-hero-text">
        <p className="trending-hero-badge">{shelvesLine(item.count)}</p>
        <h2>{item.title}</h2>
        {item.creator && <p className="trending-hero-creator">{item.creator}</p>}
        {item.desc && <p className="trending-hero-desc">{item.desc}</p>}
        <div className="trending-hero-actions">
          <button type="button" className="btn" onClick={() => onOpen(item)}>
            See details
          </button>
        </div>
      </div>
    </section>
  );
}

function Chart({ items, kind, onOpen }) {
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const square = kindOf(kind).square;

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    setEdges({
      start: node.scrollLeft < 8,
      end: node.scrollLeft + node.clientWidth > node.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure, items]);

  const nudge = (direction) => {
    const node = track.current;
    node?.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="trending-chart" aria-labelledby="chart-title">
      <div className="trending-chart-head">
        <h2 id="chart-title">More trending this week</h2>
        <div className="trending-chart-nav">
          <button type="button" className="icon-btn" onClick={() => nudge(-1)} disabled={edges.start} aria-label="Scroll left">
            <CaretLeft size={18} weight="bold" />
          </button>
          <button type="button" className="icon-btn" onClick={() => nudge(1)} disabled={edges.end} aria-label="Scroll right">
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      </div>
      <ol ref={track} className={`trending-track${square ? " trending-track-square" : ""}`} start={2} onScroll={measure}>
        {items.map((item, index) => (
          <li key={item.externalId} className="trending-tile" style={{ "--i": index }}>
            <button type="button" className="trending-tile-button" onClick={() => onOpen(item)}>
              <span className="trending-tile-art">
                <span className="trending-tile-rank" aria-hidden="true">
                  {index + 2}
                </span>
                <Poster title={item.title} posterPath={item.posterPath} kind={kind} />
              </span>
              <span className="trending-tile-text">
                <strong>{item.title}</strong>
                <span>{item.creator || shelvesLine(item.count)}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrendingSkeleton() {
  return (
    <div className="trending-skeleton" aria-busy="true" aria-label="Loading trending">
      <span className="skeleton trending-skeleton-hero" />
      <div className="trending-skeleton-track">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="skeleton trending-skeleton-tile" style={{ "--i": index }} />
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
              <Spotlight item={items[0]} kind={kind} onOpen={setSelected} />
              {items.length > 1 && <Chart items={items.slice(1)} kind={kind} onOpen={setSelected} />}
            </div>
          )}
        </>
      )}

      <MovieDetail movie={selected} kind={kind} onClose={() => setSelected(null)} />
    </>
  );
}
