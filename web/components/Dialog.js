"use client";

import { useEffect, useRef } from "react";

export default function Dialog({ open, onClose, labelledBy, className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`detail ${className}`}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      {open && children}
    </dialog>
  );
}
