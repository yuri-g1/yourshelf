"use client";

import Link from "next/link";
import Avatar from "@/components/Avatar";
import ConfirmButton from "@/components/ConfirmButton";
import Dialog from "@/components/Dialog";
import Poster from "@/components/Poster";

export default function MovieDetail({ movie, kind, recommenderHref, canRemove, onRemove, onClose }) {
  const recommender = movie?.recommendedBy;

  return (
    <Dialog open={Boolean(movie)} onClose={onClose} labelledBy="detail-title">
      {movie && (
        <div className="detail-body">
          <div className="detail-poster">
            <Poster title={movie.title} posterPath={movie.posterPath} kind={kind} />
          </div>

          <div className="detail-info">
            <h2 id="detail-title">
              {movie.title}
              {movie.year && <span className="movie-year"> ({movie.year})</span>}
            </h2>

            {recommender && (
              <div className="movie-from">
                <Avatar name={recommender.name} size="sm" />
                <span>
                  Recommended by <Link href={recommenderHref}>{recommender.name}</Link>
                </span>
              </div>
            )}

            {movie.recommendationText && (
              <p className="note">“{movie.recommendationText}”</p>
            )}

            <p className="detail-desc">{movie.desc || "No synopsis yet."}</p>

            <div className="detail-actions">
              {canRemove && (
                <ConfirmButton
                  label="Remove from shelf"
                  confirmLabel="Remove it"
                  onConfirm={async () => {
                    onClose();
                    await onRemove(movie);
                  }}
                />
              )}
              <button type="button" className="btn btn-small btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
