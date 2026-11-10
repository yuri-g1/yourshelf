"use client";

import { useState } from "react";
import MovieSearch from "@/components/MovieSearch";
import Poster from "@/components/Poster";

const EMPTY = { title: "", desc: "", note: "", externalId: "", posterPath: "" };

export default function MovieForm({ title, subtitle, submitLabel, withNote, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
    });
  }

  function clearPick() {
    setForm({ ...form, externalId: "", posterPath: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onSubmit(form);
      setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h2>{title}</h2>
      {subtitle && <p className="panel-sub">{subtitle}</p>}

      <form className="form" onSubmit={handleSubmit}>
        {form.externalId ? (
          <div className="picked">
            <div className="picked-poster">
              <Poster title={form.title} posterPath={form.posterPath} />
            </div>
            <div>
              <strong>{form.title}</strong>
              <p className="field-hint">From TMDB</p>
              <button type="button" className="text-link" onClick={clearPick}>
                Use another movie
              </button>
            </div>
          </div>
        ) : (
          <MovieSearch onPick={pick} />
        )}

        <div className="field">
          <label htmlFor="movie-title">Title</label>
          <input
            id="movie-title"
            value={form.title}
            onChange={update("title")}
            placeholder="Or type it yourself"
            maxLength={100}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="movie-desc">Synopsis</label>
          <textarea
            id="movie-desc"
            value={form.desc}
            onChange={update("desc")}
            placeholder="What is it about?"
            maxLength={500}
          />
          <span className="field-hint">Optional</span>
        </div>

        {withNote && (
          <div className="field">
            <label htmlFor="movie-note">Why should they watch it?</label>
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

        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
