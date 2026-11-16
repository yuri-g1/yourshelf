"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  Pause,
  Play,
  Star,
  X,
} from "@phosphor-icons/react";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import Poster from "@/components/Poster";
import { SlowNote } from "@/components/Skeletons";
import { ratingText, useDetails } from "@/lib/details";
import { kindOf, mediaHref } from "@/lib/kinds";

const CREATOR_PREFIX = { movie: "Directed by", game: "Developed by" };
const GALLERY_PREVIEW = 6;

function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="text-link media-back"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      <ArrowLeft size={16} weight="bold" aria-hidden="true" />
      Back
    </button>
  );
}

function Section({ title, id, className = "", children }) {
  return (
    <section className={`media-section ${className}`} id={id} aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Overview({ desc, story, label }) {
  const [full, setFull] = useState(false);
  const long = desc.length > 600;

  return (
    <Section title={label}>
      <div className="media-prose">
        <p className={long && !full ? "is-clamped" : ""}>{desc}</p>
        {long && (
          <button type="button" className="text-link item-more" onClick={() => setFull(!full)}>
            {full ? "Show less" : "Read more"}
          </button>
        )}
        {story && (
          <>
            <h3>Story</h3>
            <p>{story}</p>
          </>
        )}
      </div>
    </Section>
  );
}

function Videos({ videos, active, onPlay }) {
  const current = active || videos[0];

  return (
    <Section title={videos.length === 1 ? "Trailer" : "Videos"} id="media-videos">
      <div className="media-player">
        {active ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${active.key}?autoplay=1&rel=0`}
            title={active.name}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" className="media-player-cover" onClick={() => onPlay(current)}>
            <img src={current.thumb} alt="" loading="lazy" />
            <span className="media-play-badge">
              <Play size={22} weight="fill" aria-hidden="true" />
            </span>
            <span className="sr-only">Play {current.name}</span>
          </button>
        )}
      </div>
      {videos.length > 1 && (
        <ul className="media-video-list">
          {videos.map((video) => (
            <li key={video.key}>
              <button
                type="button"
                className={`media-video${video.key === active?.key ? " is-active" : ""}`}
                onClick={() => onPlay(video)}
              >
                <span className="media-video-thumb">
                  <img src={video.thumb} alt="" loading="lazy" />
                  <Play size={16} weight="fill" aria-hidden="true" />
                </span>
                <span className="media-video-name">{video.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function Tracks({ tracks }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    const player = new Audio();
    player.preload = "none";
    player.volume = 0.8;
    const stop = () => setPlaying(null);
    player.addEventListener("ended", stop);
    player.addEventListener("error", stop);
    audio.current = player;

    return () => {
      player.pause();
      player.removeEventListener("ended", stop);
      player.removeEventListener("error", stop);
      audio.current = null;
    };
  }, []);

  function toggle(track) {
    const player = audio.current;
    if (!player || !track.preview) return;

    if (playing === track.position) {
      player.pause();
      setPlaying(null);
      return;
    }

    player.src = track.preview;
    player.play().then(
      () => setPlaying(track.position),
      () => setPlaying(null),
    );
  }

  return (
    <Section title="Tracklist">
      <ol className="media-tracks">
        {tracks.map((track) => {
          const on = playing === track.position;

          return (
            <li key={track.position} className={on ? "is-playing" : ""}>
              {track.preview ? (
                <button
                  type="button"
                  className="media-track-play"
                  onClick={() => toggle(track)}
                  aria-label={`${on ? "Pause" : "Play"} preview of ${track.title}`}
                  aria-pressed={on}
                >
                  <span className="media-track-number" aria-hidden="true">
                    {track.position}
                  </span>
                  {on ? <Pause size={16} weight="fill" aria-hidden="true" /> : <Play size={16} weight="fill" aria-hidden="true" />}
                </button>
              ) : (
                <span className="media-track-play is-static" aria-hidden="true">
                  <span className="media-track-number">{track.position}</span>
                </span>
              )}
              <span className="media-track-title">
                <span>{track.title}</span>
                {track.artist && <span className="media-track-artist">{track.artist}</span>}
              </span>
              {track.explicit && (
                <span className="media-explicit" title="Explicit">
                  E
                </span>
              )}
              <span className="media-track-length">{track.length}</span>
            </li>
          );
        })}
      </ol>
      <p className="media-note">Previews are 30 seconds long, courtesy of Deezer.</p>
    </Section>
  );
}

function useCarousel() {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const row = ref.current;
    if (!row) return;
    setEdges({
      start: row.scrollLeft <= 2,
      end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;

    update();
    row.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(row);

    return () => {
      row.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  function page(direction) {
    const row = ref.current;
    if (!row) return;
    const items = row.children;
    if (items.length < 2) return;
    const step = items[1].offsetLeft - items[0].offsetLeft;
    const perPage = Math.max(1, Math.floor((row.clientWidth + step - items[0].offsetWidth) / step));
    const current = Math.round(row.scrollLeft / step);
    const max = row.scrollWidth - row.clientWidth;
    const target = Math.min(max, Math.max(0, (current + direction * perPage) * step));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: target, behavior: still ? "auto" : "smooth" });
  }

  return { ref, edges, page };
}

function Carousel({ title, className = "", rowClassName, children }) {
  const { ref, edges, page } = useCarousel();
  const fits = edges.start && edges.end;

  return (
    <section className={`media-section ${className}`} aria-label={title}>
      <div className="media-section-head">
        <h2>{title}</h2>
        {!fits && (
          <div className="media-carousel-nav">
            <button
              type="button"
              className="icon-btn"
              onClick={() => page(-1)}
              disabled={edges.start}
              aria-label={`Previous in ${title}`}
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => page(1)}
              disabled={edges.end}
              aria-label={`Next in ${title}`}
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
      <ul ref={ref} className={`media-carousel ${rowClassName}`}>
        {children}
      </ul>
    </section>
  );
}

function People({ label, list }) {
  return (
    <Carousel title={label} rowClassName="media-people">
      {list.map((person, index) => (
        <li key={`${person.name}-${index}`}>
          {person.image ? (
            <img className="media-person-photo" src={person.image} alt="" loading="lazy" />
          ) : (
            <span className="media-person-photo">
              <Avatar name={person.name} size="lg" />
            </span>
          )}
          <span className="media-person-name">{person.name}</span>
          {person.role && <span className="media-person-role">{person.role}</span>}
        </li>
      ))}
    </Carousel>
  );
}

function Gallery({ label, list, title }) {
  const [open, setOpen] = useState(null);
  const count = list.length;
  const visible = Math.min(count, GALLERY_PREVIEW);

  useEffect(() => {
    if (open === null) return;

    function onKey(event) {
      if (event.key === "ArrowRight") setOpen((index) => (index + 1) % count);
      if (event.key === "ArrowLeft") setOpen((index) => (index - 1 + count) % count);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  const shown = open === null ? null : list[open];

  return (
    <Section title={label}>
      <ul className="media-gallery">
        {list.slice(0, visible).map((shot, index) => {
          const rest = index === visible - 1 ? count - visible : 0;

          return (
            <li key={shot.full}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={rest > 0 ? `Open gallery, ${count} images` : `Open image ${index + 1} of ${count}`}
              >
                <img src={shot.thumb} alt="" loading="lazy" />
                {rest > 0 && (
                  <span className="media-gallery-more" aria-hidden="true">
                    +{rest}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open !== null} onClose={() => setOpen(null)} labelledBy="lightbox-title" className="lightbox">
        {shown && (
          <figure className="lightbox-figure">
            <img src={shown.full} alt={`${title}, image ${open + 1} of ${count}`} />
            <figcaption id="lightbox-title">
              {open + 1} / {count}
            </figcaption>
            <button type="button" className="icon-btn lightbox-close" onClick={() => setOpen(null)} aria-label="Close">
              <X size={18} weight="bold" />
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  className="icon-btn lightbox-prev"
                  onClick={() => setOpen((open - 1 + count) % count)}
                  aria-label="Previous image"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  className="icon-btn lightbox-next"
                  onClick={() => setOpen((open + 1) % count)}
                  aria-label="Next image"
                >
                  <CaretRight size={18} weight="bold" />
                </button>
              </>
            )}
          </figure>
        )}
      </Dialog>
    </Section>
  );
}

function Similar({ kind, label, list }) {
  return (
    <Carousel
      title={label}
      className="media-similar"
      rowClassName={`media-similar-row${kindOf(kind).square ? " is-square" : ""}`}
    >
      {list.map((item) => (
        <li key={item.externalId}>
          <Link href={mediaHref(kind, item.externalId)} className="media-similar-card">
            <Poster title={item.title} src={item.image} kind={kind} />
            <span className="media-similar-title">{item.title}</span>
            {item.year && <span className="media-similar-year">{item.year}</span>}
          </Link>
        </li>
      ))}
    </Carousel>
  );
}

function Watch({ watch }) {
  return (
    <section className="media-panel">
      <h2>Where to watch</h2>
      {watch.groups.map((group) => (
        <div key={group.label} className="media-watch-group">
          <span className="media-watch-label">{group.label}</span>
          <ul className="media-providers">
            {group.providers.map((provider) => (
              <li key={provider.name} title={provider.name}>
                {provider.logo && <img src={provider.logo} alt="" loading="lazy" />}
                <span className="sr-only">{provider.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="media-note">
        {watch.link ? (
          <a href={watch.link} target="_blank" rel="noopener noreferrer">
            All options in {watch.region}
          </a>
        ) : (
          `Showing ${watch.region}`
        )}
        {" · "}Data from {watch.credit}
      </p>
    </section>
  );
}

function MediaSkeleton() {
  return (
    <div className="media" aria-busy="true" aria-label="Loading">
      <div className="media-back-spacer" />
      <div className="media-hero">
        <span className="skeleton media-poster-bone" />
        <div className="media-heading">
          <span className="skeleton sk-meta" />
          <span className="skeleton sk-title" />
          <span className="skeleton sk-text" />
        </div>
      </div>
      <SlowNote />
    </div>
  );
}

function MediaMissing({ kind, error }) {
  const config = kindOf(kind);
  const notFound = error?.status === 404 || error?.status === 400;

  return (
    <div className="media media-missing">
      <BackButton />
      <div className="empty empty-cta">
        <h1>{notFound ? `We could not find that ${config.noun}` : `This ${config.noun} did not load`}</h1>
        <p className="muted">
          {notFound ? `It may have been removed from ${config.source}.` : error?.message || "Try again in a moment."}
        </p>
      </div>
    </div>
  );
}

export default function MediaPage({ kind, id }) {
  const config = kindOf(kind);
  const { data, error } = useDetails(kind, id);
  const [video, setVideo] = useState(null);

  if (error) return <MediaMissing kind={kind} error={error} />;
  if (!data) return <MediaSkeleton />;

  const art = data.backdrop || data.poster;
  const rating = ratingText(data.rating);
  const prefix = CREATOR_PREFIX[kind];

  function playTrailer() {
    setVideo(data.videos[0]);
    document.getElementById("media-videos")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <article className={`media media-${kind}`}>
      <title>{`${data.title} · yourshelf`}</title>
      <div
        className={`media-backdrop${data.backdrop ? "" : " is-soft"}`}
        style={art ? { "--art": `url("${art}")` } : undefined}
        aria-hidden="true"
      />

      <BackButton />

      <header className="media-hero">
        <div className={`media-poster${config.square ? " is-square" : ""}`}>
          <Poster title={data.title} src={data.poster} kind={kind} />
        </div>

        <div className="media-heading">
          <div className="item-chips">
            <span className="chip">{config.source}</span>
            {data.year && <span className="chip chip-plain">{data.year}</span>}
            {rating && (
              <span className="chip chip-plain" title={`${data.rating.count} ratings on ${config.source}`}>
                <Star size={12} weight="fill" aria-hidden="true" />
                {rating}
              </span>
            )}
          </div>
          <h1>{data.title}</h1>
          {data.creator && (
            <p className="media-creator">
              {prefix ? `${prefix} ` : ""}
              <strong>{data.creator}</strong>
            </p>
          )}
          {data.tagline && <p className="media-tagline">{data.tagline}</p>}
          {data.highlights.length > 0 && <p className="media-highlights">{data.highlights.join(" · ")}</p>}

          {data.videos.length > 0 && (
            <div className="media-cta">
              <button type="button" className="btn" onClick={playTrailer}>
                <Play size={16} weight="fill" aria-hidden="true" />
                Play trailer
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="media-layout">
        <div className="media-main">
          {data.desc && <Overview desc={data.desc} story={data.story} label={config.descLabel} />}
          {!data.desc && data.tracks.length === 0 && (
            <Section title={config.descLabel}>
              <p className="muted">
                {config.source} has no {config.descLabel.toLowerCase()} for this one.
              </p>
            </Section>
          )}
          {data.tracks.length > 0 && <Tracks tracks={data.tracks} />}
          {data.videos.length > 0 && <Videos videos={data.videos} active={video} onPlay={setVideo} />}
          {data.people.list.length > 0 && <People label={data.people.label} list={data.people.list} />}
          {data.gallery.list.length > 0 && (
            <Gallery label={data.gallery.label} list={data.gallery.list} title={data.title} />
          )}
        </div>

        <aside className="media-side">
          {data.facts.length > 0 && (
            <section className="media-panel">
              <h2>Details</h2>
              <dl className="media-facts">
                {data.facts.map((entry) => (
                  <div key={entry.label}>
                    <dt>{entry.label}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {data.genres.length > 0 && (
            <section className="media-panel">
              <h2>{kind === "book" ? "Subjects" : "Genres"}</h2>
              <div className="media-tags">
                {data.genres.map((genre) => (
                  <span key={genre} className="chip chip-plain">
                    {genre}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.watch && <Watch watch={data.watch} />}

          {data.links.length > 0 && (
            <section className="media-panel">
              <h2>Links</h2>
              <ul className="media-links">
                {data.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.label}
                      <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {data.similar.list.length > 0 && <Similar kind={kind} label={data.similar.label} list={data.similar.list} />}
    </article>
  );
}
