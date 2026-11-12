"use client";

import { useEffect, useRef, useState } from "react";

const CLOSE_MS = 220;

// A native <dialog> that fades in and also fades out: when `open` turns
// false it plays the closing animation first and only then closes.
export default function Dialog({ open, onClose, labelledBy, className = "", children }) {
  const ref = useRef(null);
  // children stay mounted through the fade-out, then unmount so forms reset
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    const dialog = ref.current;

    if (open) {
      setMounted(true);
      dialog.classList.remove("is-closing");
      if (!dialog.open) {
        dialog.showModal();
        dialog.querySelector("[data-autofocus]")?.focus();
      }
      return;
    }

    if (!dialog.open) {
      setMounted(false);
      return;
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      dialog.close();
      setMounted(false);
      return;
    }

    dialog.classList.add("is-closing");
    const timer = setTimeout(() => {
      dialog.classList.remove("is-closing");
      dialog.close();
      setMounted(false);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`detail ${className}`}
      aria-labelledby={labelledBy}
      // Esc: let the parent close it so the fade-out runs
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      {(open || mounted) && children}
    </dialog>
  );
}
