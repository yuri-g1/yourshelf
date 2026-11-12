"use client";

import { Children, useLayoutEffect, useRef, useState } from "react";

export default function Bookcase({
  children,
  crown,
  empty,
  kind = "movie",
  square = false,
  rows,
  className = "",
  ...rest
}) {
  const ref = useRef(null);
  const [columns, setColumns] = useState(0);
  const all = Children.toArray(children).filter(Boolean);
  const items = rows && columns ? all.slice(0, columns * rows) : all;
  const count = items.length;

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid) return;

    function measure() {
      const tracks = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean);
      setColumns(tracks.length);
      if (tracks[0]) grid.style.setProperty("--col-w", tracks[0]);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const grid = ref.current;
    if (!grid || !columns) return;
    Array.from(grid.children).forEach((child, index) => {
      const col = index % columns;
      child.style.setProperty("--col", String(col));
      child.dataset.edge =
        columns === 1 ? "both" : col === 0 ? "start" : col === columns - 1 ? "end" : "";
    });
  });

  const spare = !columns ? 0 : count === 0 ? columns : (columns - (count % columns)) % columns;

  return (
    <div className={`bookcase${crown ? " has-switch" : ""} ${className}`} {...rest}>
      {crown && <div className="bookcase-switch">{crown}</div>}
      <div className="bookcase-grid" ref={ref}>
        {items}
        {Array.from({ length: spare }, (_, index) => (
          <div key={`spare-${index}`} className="shelf-spare" aria-hidden="true">
            <span className={`case case-${kind} case-empty`}>
              <span className={`shelf-spare-space${square ? " poster-square" : ""}`} />
            </span>
            <span className="shelf-ledge" />
          </div>
        ))}
        {count === 0 && empty && <div className="bookcase-empty">{empty}</div>}
      </div>
    </div>
  );
}
