"use client";

import { useEffect, useState } from "react";
import MovieSearch from "@/components/MovieSearch";
import Poster from "@/components/Poster";
import { kindOf } from "@/lib/kinds";

const EMPTY = { title: "", desc: "", note: "", externalId: "", posterPath: "", year: "" };

export default function MovieForm({ kind, title, subtitle, submitLabel, successMessage, withNote, onSubmit, onDone }) {
  const config = kindOf(kind);
  const [form, setForm] = useState(EMPTY);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  function pick(movie) {
    setForm({
      ...form,
      title: movie.title,
      desc: movie.desc,
      externalId: movie.externalId,
      posterPath: movie.posterPath || "",
      year: movie.year || "",
    });
    setManual(false);
  }

  function reset() {
    setForm({ ...EMPTY, note: form.note });
    setManual(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onSubmit(form);
      setForm(EMPTY);
      setManual(false);
      setStatus(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const picked = Boolean(form.externalId);
  const ready = picked || (manual && form.title.trim());

  return (
    <div className="add-form">
      <div className="add-form-head">
        <div>
          <h2 id="add-title">{title}</h2>
          {subtitle && <p className="panel-sub">{subtitle}</p>}
        </div>
        <button type="button" className="btn btn-small btn-ghost" onClick={onDone}>
          Done
        </button>
      </div>

      <p className="form-status" role="status">
        {status}
      </p>

      <form className="form" onSubmit={handleSubmit}>
        {picked && (
          <div className="picked">
            <div className="picked-poster">
              <Poster title={form.title} posterPath={form.posterPath} kind={kind} />
            </div>
            <div>
              <strong>{form.title}</strong>
              {form.year && <span className="muted"> ({form.year})</span>}
              <p className="field-hint">From {config.source}</p>
              <button type="button" className="text-link" onClick={reset}>
                Choose another {config.noun}
              </button>
            </div>
          </div>
        )}

        {!picked && !manual && (
          <>
            <MovieSearch kind={kind} onPick={pick} autoFocus />
            <button type="button" className="text-link manual-link" onClick={() => setManual(true)}>
              Can't find it? Add it yourself
            </button>
          </>
        )}

        {manual && (
          <>
            <div className="field">
              <label htmlFor="movie-title">Title</label>
              <input
                id="movie-title"
                value={form.title}
                onChange={update("title")}
                maxLength={100}
                autoFocus
                required
              />
            </div>

            <div className="field">
              <label htmlFor="movie-desc">{config.descLabel}</label>
              <textarea id="movie-desc" value={form.desc} onChange={update("desc")} maxLength={500} />
              <span className="field-hint">Optional</span>
            </div>

            <button type="button" className="text-link manual-link" onClick={reset}>
              Search {config.source} instead
            </button>
          </>
        )}

        {withNote && (picked || manual) && (
          <div className="field">
            <label htmlFor="movie-note">Why should they {config.verb} it?</label>
            <textarea
              id="movie-note"
              value={form.note}
              onChange={update("note")}
              placeholder="A line or two for your friend"
              maxLength={500}
            />
            <span className="field-hint">Optional, shows on their shelf</span>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {(picked || manual) && (
          <button className="btn" disabled={saving || !ready}>
            {saving ? "Saving..." : submitLabel}
          </button>
        )}
      </form>
    </div>
  );
}
