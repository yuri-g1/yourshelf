"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function TabBar({ pending }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const tabs = [
    { href: "/", label: "My shelf" },
    { href: "/explore", label: "Explore" },
    { href: "/friends", label: "Friends", badge: pending },
  ];

  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="nav-count" aria-label={`${tab.badge} pending`}>
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
