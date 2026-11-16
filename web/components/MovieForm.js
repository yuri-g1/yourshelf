"use client";

import { ArrowLeft, CheckCircle, PencilSimple, X } from "@phosphor-icons/react";
import { useState } from "react";
import MovieSearch from "@/components/MovieSearch";
import Poster from "@/components/Poster";
import { kindOf } from "@/lib/kinds";

const EMPTY = { title: "", desc: "", note: "", externalId: "", posterPath: "", year: "", creator: "" };

export default function MovieForm({ kind, title, subtitle, submitLabel, withNote, onSubmit, onDone }) {
  const config = kindOf(kind);
  const [form, setForm] = useState(EMPTY);
  const [mode, setMode] = useState("search");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState([]);

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  function pick(movie) {
    setForm({
      ...form,
      title: movie.title,
      desc: movie.desc || "",
      externalId: movie.externalId,
      posterPath: movie.posterPath || "",
      year: movie.year || "",
      creator: movie.creator || "",
    });
    setError("");
    setMode("picked");
  }

  function manual(prefill = "") {
    setForm({ ...EMPTY, title: prefill, note: form.note });
    setError("");
    setMode("manual");
  }

  function back() {
    setForm({ ...EMPTY, note: form.note });
    setError("");
    setMode("search");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;
    setError("");
    setSaving(true);

    try {
      await onSubmit(form);
      setAdded((list) => [{ key: `${Date.now()}`, title: form.title.trim() }, ...list]);
      setForm(EMPTY);
      setMode("search");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const ready = mode === "picked" || (mode === "manual" && form.title.trim());
  const meta = [form.year, form.creator].filter(Boolean).join(", ");

  return (
    <div className="add-form">
      <header className="add-form-head">
        <div>
          <h2 id="add-title">{title}</h2>
          {subtitle && <p className="add-form-sub">{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn" onClick={onDone} aria-label="Close">
          <X size={18} weight="bold" />
        </button>
      </header>

      {added.length > 0 && (
        <div className="add-log" role="status">
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
          <p>
            <span className="add-log-lead">{added.length === 1 ? "Added" : `Added ${added.length}`}</span>{" "}
            {added.slice(0, 3).map((item, index) => (
              <span key={item.key} className="add-log-item">
                {index > 0 && ", "}
                {item.title}
              </span>
            ))}
            {added.length > 3 && <span className="add-log-item">, and more</span>}
          </p>
        </div>
      )}

      <form className="add-form-body" onSubmit={handleSubmit}>
        {mode === "search" && (
          <div className="add-step" key="search">
            <MovieSearch kind={kind} onPick={pick} onManual={manual} autoFocus />
            <button type="button" className="add-manual" onClick={() => manual()}>
              <PencilSimple size={16} weight="bold" aria-hidden="true" />
              Not on {config.source}? Add it by hand
            </button>
          </div>
        )}

        {mode === "picked" && (
          <div className="add-step" key="picked">
            <div className="picked">
              <div className="picked-poster">
                <Poster title={form.title} posterPath={form.posterPath} kind={kind} />
              </div>
              <div className="picked-info">
                <strong className="picked-title">{form.title}</strong>
                {meta && <span className="picked-meta">{meta}</span>}
                {form.desc && <p className="picked-desc">{form.desc}</p>}
                <span className="picked-source">From {config.source}</span>
              </div>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="add-step" key="manual">
            <div className="handmade">
              <div className="handmade-preview">
                <Poster title={form.title || "Title"} kind={kind} />
                <span className="handmade-caption">Live preview</span>
              </div>

              <div className="handmade-fields">
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

                {config.creatorLabel && (
                  <div className="field">
                    <label htmlFor="movie-creator">
                      {config.creatorLabel} <span className="field-optional">optional</span>
                    </label>
                    <input id="movie-creator" value={form.creator} onChange={update("creator")} maxLength={100} />
                  </div>
                )}

                <div className="field">
                  <label htmlFor="movie-desc">
                    {config.descLabel} <span className="field-optional">optional</span>
                  </label>
                  <textarea
                    id="movie-desc"
                    value={form.desc}
                    onChange={update("desc")}
                    maxLength={500}
                    rows={3}
                  />
                  <span className="field-hint field-count">{form.desc.length}/500</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {withNote && mode !== "search" && (
          <div className="field">
            <label htmlFor="movie-note">
              Why should they {config.verb} it? <span className="field-optional">optional</span>
            </label>
            <textarea
              id="movie-note"
              value={form.note}
              onChange={update("note")}
              placeholder="A line or two for your friend"
              maxLength={500}
              rows={2}
            />
            <span className="field-hint">Shows next to it on their shelf</span>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {mode !== "search" && (
          <div className="add-actions">
            <button type="button" className="btn btn-ghost" onClick={back} disabled={saving}>
              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
              {mode === "picked" ? "Pick another" : `Search ${config.source}`}
            </button>
            <button className="btn" disabled={saving || !ready}>
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
