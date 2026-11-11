"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

// Links for the floating dock. A lavender block sits behind the current
// page and slides to the new one when the route changes.
export default function DockNav({ links, className = "", label = "Main" }) {
  const pathname = usePathname();
  const listRef = useRef(null);
  const [mark, setMark] = useState(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function measure() {
      const active = list.querySelector('[aria-current="page"]');
      setMark(active ? { x: active.offsetLeft, w: active.offsetWidth } : null);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [pathname, links.length]);

  return (
    <nav className={`dock-nav ${className}`} aria-label={label} ref={listRef}>
      <span
        className="dock-mark"
        aria-hidden="true"
        style={
          mark
            ? { width: mark.w, transform: `translateX(${mark.x}px)`, opacity: 1 }
            : { opacity: 0 }
        }
      />
      {links.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`dock-link ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
            {link.badge > 0 && (
              <span className="dock-count" aria-label={`${link.badge} pending`}>
                {link.badge > 9 ? "9+" : link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
