"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/Avatar";
import { findUser, relationsOf, useDemo } from "@/lib/demo";

export default function Header() {
  const data = useDemo();
  const pathname = usePathname();
  const me = findUser(data, data.me);
  const pending = relationsOf(data, data.me).filter(
    (relation) => relation.status === "pending" && relation.direction === "received",
  ).length;

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" aria-label="yourshelf, my shelf">
          <img src="/logo.svg" alt="yourshelf" className="logo" />
        </Link>

        <nav className="nav">
          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
            My shelf
          </Link>
          <Link
            href="/friends"
            className={`nav-link ${pathname === "/friends" ? "active" : ""}`}
          >
            Friends
            {pending > 0 && <span className="nav-count">{pending}</span>}
          </Link>
          <div className="user-pill">
            <Avatar name={me?.name} size="sm" />
            <span className="user-pill-name">{me?.name}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
