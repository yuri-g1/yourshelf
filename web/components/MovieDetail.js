"use client";

import Link from "next/link";
import { ArrowUpRight, PencilSimple, Quotes, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import ConfirmButton from "@/components/ConfirmButton";
import Dialog from "@/components/Dialog";
import Poster from "@/components/Poster";
import { kindOf } from "@/lib/kinds";
import { toneOf } from "@/lib/tone";

const CLAMP = 320;

export default function MovieDetail({ movie: current, kind, recommenderHref, canRemove, onRemove, onClose }) {
  const last = useRef(current);
  if (current) last.current = current;
  const movie = current || last.current;
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (current) setFull(false);
  }, [current]);

  const config = kindOf(kind);
  const recommender = movie?.recommendedBy;
  const handmade = movie && !movie.externalId;
  const art = movie && (movie.cover || (movie.posterPath ? config.image(movie.posterPath) : null));
  const desc = movie?.desc?.trim();
  const long = desc && desc.length > CLAMP;
  const href = movie?.externalId && config.link ? config.link(movie.externalId) : null;
  const facts = movie ? [movie.year, movie.platform].filter(Boolean) : [];

  return (
    <Dialog open={Boolean(current)} onClose={onClose} labelledBy="detail-title" className="item-dialog">
      {movie && (
        <article className={`item${handmade ? " is-handmade" : ""}`}>
          <div
            className={`item-glow${art ? "" : ` poster-${toneOf(movie.title)}`}`}
            style={art ? { "--art": `url("${art}")` } : undefined}
            aria-hidden="true"
          />

          <button type="button" className="icon-btn item-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>

          <div className="item-head">
            <div className={`item-poster${config.square ? " is-square" : ""}`}>
              <Poster
                title={movie.title}
                posterPath={movie.posterPath}
                src={movie.cover}
                kind={kind}
              />
            </div>

            <div className="item-title">
              <div className="item-chips">
                {handmade ? (
                  <span className="chip chip-hand">
                    <PencilSimple size={13} weight="bold" aria-hidden="true" />
                    Added by hand
                  </span>
                ) : (
                  <span className="chip">{config.source}</span>
                )}
                {facts.map((fact) => (
                  <span key={fact} className="chip chip-plain">
                    {fact}
                  </span>
                ))}
              </div>
              <h2 id="detail-title">{movie.title}</h2>
              {movie.creator && <p className="item-creator">{movie.creator}</p>}
            </div>
          </div>

          <div className="item-body">
            {recommender && (
              <figure className="item-rec">
                {movie.recommendationText && (
                  <blockquote>
                    <Quotes className="item-rec-mark" size={20} weight="fill" aria-hidden="true" />
                    <p>{movie.recommendationText}</p>
                  </blockquote>
                )}
                <figcaption>
                  <Avatar name={recommender.name} size="sm" />
                  <span>
                    Recommended by{" "}
                    {recommenderHref ? <Link href={recommenderHref}>{recommender.name}</Link> : recommender.name}
                  </span>
                </figcaption>
              </figure>
            )}

            {desc ? (
              <div className="item-desc">
                <p className={long && !full ? "is-clamped" : ""}>{desc}</p>
                {long && (
                  <button type="button" className="text-link item-more" onClick={() => setFull(!full)}>
                    {full ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            ) : (
              <p className="item-desc item-desc-empty">
                {handmade
                  ? `No ${config.descLabel.toLowerCase()} added yet.`
                  : `${config.source} has no ${config.descLabel.toLowerCase()} for this one.`}
              </p>
            )}

            {(href || canRemove) && (
              <div className="item-actions">
                {href && (
                  <a className="btn btn-small btn-ghost" href={href} target="_blank" rel="noopener noreferrer">
                    Open on {config.source}
                    <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                  </a>
                )}
                {canRemove && (
                  <ConfirmButton
                    className="item-remove"
                    label="Remove"
                    confirmLabel="Remove it"
                    onConfirm={async () => {
                      onClose();
                      await onRemove(movie);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </article>
      )}
    </Dialog>
  );
}
