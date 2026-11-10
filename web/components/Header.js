"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) {
      setPending(0);
      return;
    }

    api("/friendship")
      .then((requests) => setPending(requests.length))
      .catch(() => setPending(0));
  }, [user, pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" aria-label="yourshelf home">
          <img src="/logo.svg" alt="yourshelf" className="logo" />
        </Link>

        {!loading && (
          <nav className="nav">
            {user ? (
              <>
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
                  <Avatar name={user.name} size="sm" />
                  <span className="user-pill-name">{user.name}</span>
                  <button className="btn btn-small" onClick={handleSignOut}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
                  Shelves
                </Link>
                <Link href="/login" className="btn btn-small btn-soft">
                  Sign in
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
