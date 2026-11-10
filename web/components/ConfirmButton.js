"use client";

import { useEffect, useState } from "react";

export default function ConfirmButton({ label, confirmLabel, onConfirm, className = "" }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!asking) return;
    const timer = setTimeout(() => setAsking(false), 8000);
    return () => clearTimeout(timer);
  }, [asking]);

  async function confirm() {
    setBusy(true);

    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  if (!asking) {
    return (
      <button type="button" className={`btn btn-small btn-danger ${className}`} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="confirm" role="group" aria-label={confirmLabel}>
      <button type="button" className="btn btn-small btn-danger-solid" onClick={confirm} disabled={busy} autoFocus>
        {busy ? "..." : confirmLabel}
      </button>
      <button type="button" className="btn btn-small btn-ghost" onClick={() => setAsking(false)} disabled={busy}>
        Cancel
      </button>
    </span>
  );
}
