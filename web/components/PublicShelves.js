"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import { useApi } from "@/lib/api";

export default function PublicShelves() {
  const api = useApi();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/users")
      .then((list) => setUsers(list.filter((user) => user.visibility === "public")))
      .catch((err) => setError(err.message));
  }, [api]);

  return (
    <>
      <div className="profile reveal">
        <div>
          <h1 className="page-title">Shelves</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Browse public shelves. Create yours to swap recommendations with friends.
          </p>
        </div>
        <Link href="/signup" className="btn">
          Create your shelf
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!users && !error && <Loading label="Loading shelves..." />}

      {users && users.length === 0 && (
        <div className="empty">
          <strong>No public shelves yet</strong>
          <span>Be the first one to share yours.</span>
        </div>
      )}

      {users && users.length > 0 && (
        <div className="people reveal reveal-2">
          {users.map((user) => (
            <Link key={user._id} href={`/shelf/${user._id}`} className="person-card">
              <Avatar name={user.name} />
              <span className="person-card-name">{user.name}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
