"use client";

import Link from "next/link";
import { useState } from "react";
import Dialog from "@/components/Dialog";
import { api } from "@/lib/api";

export default function DeleteAccountDialog({ open, onClose, onDeleted }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="delete-account-title" className="delete-dialog">
      <DeleteAccountForm onClose={onClose} onDeleted={onDeleted} />
    </Dialog>
  );
}

function DeleteAccountForm({ onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await api("/me", { method: "DELETE", body: { password } });
      onDeleted();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="delete-account form" onSubmit={handleSubmit}>
      <h2 id="delete-account-title">Delete your account?</h2>
      <p>This can&apos;t be undone. We will permanently delete:</p>
      <ul>
        <li>your account, username and email;</li>
        <li>your whole shelf, including what friends recommended to you;</li>
        <li>the recommendations you left on your friends&apos; shelves;</li>
        <li>your friendships and friend requests.</li>
      </ul>
      <p className="muted">
        Copies in our providers&apos; backups and logs are removed on their normal schedule. See the{" "}
        <Link href="/privacy" onClick={onClose}>
          Privacy Policy
        </Link>
        .
      </p>

      <div className="field">
        <label htmlFor="delete-password">Enter your password to confirm</label>
        <input
          id="delete-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          data-autofocus
          required
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="delete-account-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-danger-solid" disabled={busy || !password}>
          {busy ? "Deleting..." : "Delete my account"}
        </button>
      </div>
    </form>
  );
}
