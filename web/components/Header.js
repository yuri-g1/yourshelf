"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import TabBar from "@/components/TabBar";
import DockNav from "@/components/DockNav";
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
    : [];

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <Link href="/" aria-label="yourshelf home" className="brand-logo">
            {/* logo.svg is painted through a mask so it takes the accent color */}
            <span className="logo-mark" aria-hidden="true" />
          </Link>

          {!loading && (
            <>
              {links.length > 0 ? (
                <div className="dock dock-top">
                  <DockNav links={links} className="dock-nav-top" />
                </div>
              ) : (
                <span aria-hidden="true" />
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
              </div>
            </>
          )}
        </div>
      </header>
      {!loading && user && <TabBar links={links} />}
      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} onDeleted={handleDeleted} />
    </>
  );
}
