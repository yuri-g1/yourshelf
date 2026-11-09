"use client";

import { useState } from "react";

export default function MovieForm({ title, subtitle, submitLabel, withNote, onSubmit }) {
  const [form, setForm] = useState({ title: "", desc: "", note: "" });
  const [error, setError] = useState("");

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      onSubmit(form);
      setForm({ title: "", desc: "", note: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <h2>{title}</h2>
      {subtitle && <p className="panel-sub">{subtitle}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="movie-title">Title</label>
          <input
            id="movie-title"
            value={form.title}
            onChange={update("title")}
            placeholder="Lorem Ipsum"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="movie-desc">Synopsis</label>
          <textarea
            id="movie-desc"
            value={form.desc}
            onChange={update("desc")}
            placeholder="Dolor sit amet, consectetur adipiscing elit."
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
              placeholder="Sed do eiusmod tempor, trust me on this one."
            />
            <span className="field-hint">Optional, shows on their shelf</span>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <button className="btn">{submitLabel}</button>
      </form>
    </div>
  );
}
