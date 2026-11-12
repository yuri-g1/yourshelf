"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MarkTrack from "@/components/MarkTrack";

// Links for the floating dock. The lavender mark slides to the current page.
export default function DockNav({ links, className = "", label = "Main" }) {
  const pathname = usePathname();

  return (
    <MarkTrack
      as="nav"
      className={`dock-nav ${className}`}
      aria-label={label}
      watch={`${pathname}|${links.length}`}
    >
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
    </MarkTrack>
  );
}
