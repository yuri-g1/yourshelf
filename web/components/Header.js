"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import Avatar from "@/components/Avatar";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";

function UserMenu({ user, onSignOut, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onPointer(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }

    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.name} />
      </button>

      {open && (
        <div className="user-sheet" role="menu">
          <div className="user-sheet-head">
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              {user.email && <span>{user.email}</span>}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="user-sheet-item"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Sign out
          </button>
          <button
            type="button"
            role="menuitem"
            className="user-sheet-item user-sheet-danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut, clearUser } = useAuth();
  const [pending, setPending] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => setMenuOpen(false), [pathname, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointer(event) {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false);
    }

    function onKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  function handleDeleted() {
    setDeleting(false);
    clearUser();
    router.push("/");
  }

  const links = user
    ? [
        { href: "/", label: "My shelf" },
        { href: "/friends", label: "Friends", badge: pending },
      ]
    : [{ href: "/", label: "Home" }];

  function renderLinks(className) {
    return links.map((link) => {
      const active = pathname === link.href;

      return (
        <Link
          key={link.href}
          href={link.href}
          className={`${className} ${active ? "active" : ""}`}
          aria-current={active ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          {link.label}
          {link.badge > 0 && (
            <span className="nav-count" aria-label={`${link.badge} pending`}>
              {link.badge > 9 ? "9+" : link.badge}
            </span>
          )}
        </Link>
      );
    });
  }

  const showLinks = !loading && links.length > 0;

  return (
    <>
      <header className={`header ${menuOpen ? "is-menu-open" : ""}`} ref={headerRef}>
        <div className="container header-inner">
          <Link href="/" aria-label="yourshelf home" className="brand-logo">
            <span className="logo-mark" aria-hidden="true" />
          </Link>

          {!loading && (
            <>
              {showLinks && (
                <nav className="nav" aria-label="Main">
                  {renderLinks("nav-link")}
                </nav>
              )}

              <div className="header-end">
                {user ? (
                  <UserMenu user={user} onSignOut={handleSignOut} onDelete={() => setDeleting(true)} />
                ) : (
                  <div className="header-auth">
                    <Link href="/login" className="btn btn-small btn-ghost">
                      Sign in
                    </Link>
                    <Link href="/signup" className="btn btn-small">
                      Sign up
                    </Link>
                  </div>
                )}
                {showLinks && (
                  <button
                    type="button"
                    className="nav-toggle"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-nav"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    {menuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
                    {!menuOpen && pending > 0 && (
                      <span className="nav-toggle-count" aria-hidden="true">
                        {pending > 9 ? "9+" : pending}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {showLinks && menuOpen && (
          <nav id="mobile-nav" className="mobile-nav" aria-label="Main">
            <div className="container mobile-nav-list">{renderLinks("mobile-nav-link")}</div>
          </nav>
        )}
      </header>
      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} onDeleted={handleDeleted} />
    </>
  );
}
