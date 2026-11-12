"use client";

import { useLayoutEffect, useRef, useState } from "react";

// A pill track whose `.active` child gets a lavender block behind it that
// slides between options. Shared by the dock and every in-page switch so
// selection looks and moves the same everywhere.
export default function MarkTrack({ as: Tag = "div", className = "", watch, children, ...rest }) {
  const ref = useRef(null);
  const [mark, setMark] = useState(null);
  // the first placement snaps into position; only later changes slide
  const placed = useRef(false);

  useLayoutEffect(() => {
    const track = ref.current;
    if (!track) return;

    function measure() {
      const active = track.querySelector(":scope > .active");
      setMark(
        active
          ? { x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth, h: active.offsetHeight }
          : null,
      );
      if (active && !placed.current) requestAnimationFrame(() => (placed.current = true));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [watch]);

  return (
    <Tag className={`track ${className}`} ref={ref} {...rest}>
      <span
        className="track-mark"
        aria-hidden="true"
        style={
          mark
            ? {
                width: mark.w,
                height: mark.h,
                transform: `translate(${mark.x}px, ${mark.y}px)`,
                opacity: 1,
                transition: placed.current ? undefined : "none",
              }
            : { opacity: 0 }
        }
      />
      {children}
    </Tag>
  );
}
