"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import Poster from "@/components/Poster";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";

export default function PublicShelves() {
  const api = useApi();
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/users")
      .then((list) => setUsers(list.filter((user) => user.visibility === "public")))
      .catch((err) => setError(err.message));
  }, [api]);

  const term = filter.trim().toLowerCase();
  const visible = (users || []).filter(
    (user) => user._id !== me?._id && user.name.includes(term),
  );

  return (
    <>
      <div className="profile reveal">
        <div>
          <h1 className="page-title">Explore</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {me
              ? "Public shelves from everyone on yourshelf."
              : "Browse public shelves. Create yours to swap recommendations with friends."}
          </p>
        </div>
        {!me && (
          <Link href="/signup" className="btn">
            Create your shelf
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!users && !error && <Loading label="Loading shelves..." />}

      {users && (
        <div className="explore-filter field">
          <label htmlFor="people-filter">Find someone</label>
          <input
            id="people-filter"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Username"
            autoComplete="off"
            autoCapitalize="none"
          />
        </div>
      )}

      {users && visible.length === 0 && (
        <div className="empty">
          <strong>{term ? "No one matches that name" : "No public shelves yet"}</strong>
          <span>{term ? "Try another username." : "Be the first one to share yours."}</span>
        </div>
      )}

      {visible.length > 0 && (
        <div className="people reveal reveal-2">
          {visible.map((user) => (
            <PersonCard key={user._id} user={user} />
          ))}
        </div>
      )}
    </>
  );
}

const STRIP = 4;

function PersonCard({ user }) {
  const preview = user.preview || { picks: 0, recommended: 0, posters: [] };
  const total = preview.picks + preview.recommended;
  const slots = Array.from({ length: STRIP }, (_, index) => preview.posters[index]);

  return (
    <Link href={`/shelf/${user._id}`} className="person-card person-preview">
      <div className="person-head">
        <Avatar name={user.name} />
        <div>
          <span className="person-card-name">{user.name}</span>
          <p className="person-stats">
            {total === 0
              ? "Empty shelf"
              : `${preview.picks} ${preview.picks === 1 ? "pick" : "picks"} · ${preview.recommended} from friends`}
          </p>
        </div>
      </div>

      <div className="person-posters" aria-hidden="true">
        {slots.map((movie, index) =>
          movie ? (
            <Poster key={index} title={movie.title} posterPath={movie.posterPath} />
          ) : (
            <span key={index} className="person-posters-empty" />
          ),
        )}
      </div>
    </Link>
  );
}
