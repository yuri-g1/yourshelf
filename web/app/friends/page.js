"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import ConfirmButton from "@/components/ConfirmButton";
import PersonCard, { countsLine, totalOf } from "@/components/PersonCard";
import { FriendsSkeleton } from "@/components/Skeletons";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";

const SUGGESTIONS = 5;

// Friends exist so people can recommend things to each other. The page
// leads with what needs an answer, then the people whose shelves you can
// fill, and keeps finding new people in a side column.
export default function FriendsPage() {
  const api = useApi();
  const { user: me, loading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [requests, relationships, users] = await Promise.all([
        api("/friendship"),
        api("/relationships"),
        api("/users"),
      ]);
      setData({ requests, relationships, users });
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  useEffect(() => {
    if (me) load();
  }, [me, load]);

  async function run(key, action) {
    setError("");
    setPending(key);

    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }

  function answer(userId, state) {
    return run(`${state}:${userId}`, () =>
      api("/update-relationship-state", {
        method: "POST",
        body: { userId, relationship_state: state },
      }),
    );
  }

  if (loading || (me && !data && !error)) {
    return (
      <>
        <Heading />
        <FriendsSkeleton />
      </>
    );
  }

  if (!me) {
    return (
      <>
        <Heading />
        <div className="empty empty-cta">
          <strong>Sign in to see your friends</strong>
          <span>Your friends list, requests and new people to add all live here.</span>
          <div>
            <Link href="/login" className="btn btn-small">
              Sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Heading />
        <div className="alert alert-error" role="alert">
          {error}{" "}
          <button type="button" className="text-link" onClick={load}>
            Try again
          </button>
        </div>
      </>
    );
  }

  const previews = new Map(data.users.map((user) => [user._id, user.preview]));
  const requests = data.requests.map((item) => item.from).filter(Boolean);
  const friends = data.relationships.filter((item) => item.status === "accepted" && item.user);
  const sent = data.relationships.filter(
    (item) => item.status === "pending" && item.direction === "sent" && item.user,
  );
  const taken = new Set(
    data.relationships.filter((item) => item.status !== "denied").map((item) => item.user?._id),
  );
  const term = query.trim().toLowerCase();
  const strangers = data.users
    .filter((user) => user._id !== me._id && !taken.has(user._id))
    .filter((user) => user.name.includes(term))
    .sort((a, b) => totalOf(b.preview) - totalOf(a.preview));
  const found = term ? strangers : strangers.slice(0, SUGGESTIONS);

  return (
    <>
      <Heading count={friends.length} />

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {requests.length > 0 && (
        <section className="panel highlight requests reveal" aria-labelledby="requests-title">
          <h2 id="requests-title">
            {requests.length === 1 ? "1 person wants to be friends" : `${requests.length} people want to be friends`}
          </h2>
          <p className="panel-sub">Accept to let them recommend things to you and see your shelf.</p>
          <div className="rows">
            {requests.map((user) => (
              <div key={user._id} className="row-item">
                <Link href={`/shelf/${user._id}`} className="row-person">
                  <Avatar name={user.name} />
                  <span className="row-person-text">
                    <span>{user.name}</span>
                    <small>{countsLine(previews.get(user._id))}</small>
                  </span>
                </Link>
                <div className="row-actions">
                  <button
                    className="btn btn-small"
                    disabled={pending !== null}
                    onClick={() => answer(user._id, "accepted")}
                  >
                    {pending === `accepted:${user._id}` ? "Accepting..." : "Accept"}
                  </button>
                  <ConfirmButton
                    label="Deny"
                    confirmLabel="Deny request"
                    onConfirm={() => answer(user._id, "denied")}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="friends-layout reveal reveal-2">
        <section aria-label="Your friends">
          {friends.length > 0 ? (
            <div className="people people-tight">
              {friends.map(({ user }) => (
                <PersonCard
                  key={user._id}
                  user={user}
                  preview={previews.get(user._id)}
                  footer={
                    <>
                      <Link href={`/shelf/${user._id}`} className="btn btn-small btn-soft">
                        Recommend something
                      </Link>
                      <ConfirmButton
                        label="Unfriend"
                        confirmLabel="Unfriend"
                        className="btn-quiet"
                        onConfirm={() => answer(user._id, "denied")}
                      />
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="empty empty-cta">
              <strong>No friends yet</strong>
              <span>
                Friends can put recommendations on your shelf, and you on theirs. Search for someone in Add
                people to send your first request.
              </span>
            </div>
          )}
        </section>

        <aside className="panel friends-aside" aria-labelledby="find-title">
          <h2 id="find-title">Add people</h2>
          <div className="field">
            <label htmlFor="find-people">Search by username</label>
            <input
              id="find-people"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && setQuery("")}
              placeholder="Username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          {!term && found.length > 0 && <p className="aside-label">Fullest shelves you are not friends with</p>}

          {found.length > 0 ? (
            <div className="rows">
              {found.map((user) => (
                <div key={user._id} className="row-item">
                  <Link href={`/shelf/${user._id}`} className="row-person">
                    <Avatar name={user.name} size="sm" />
                    <span className="row-person-text">
                      <span>{user.name}</span>
                      <small>{countsLine(user.preview)}</small>
                    </span>
                  </Link>
                  <button
                    className="btn btn-small"
                    disabled={pending !== null}
                    onClick={() => run(`add:${user._id}`, () => api(`/friendship/${user._id}`, { method: "POST" }))}
                  >
                    {pending === `add:${user._id}` ? "Sending..." : "Add"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted aside-empty">
              {term ? `No one new matches "${query.trim()}".` : "You are already connected with everyone here."}
            </p>
          )}

          {sent.length > 0 && (
            <div className="aside-group">
              <h3>Waiting for an answer</h3>
              <div className="rows">
                {sent.map(({ user }) => (
                  <div key={user._id} className="row-item">
                    <Link href={`/shelf/${user._id}`} className="row-person">
                      <Avatar name={user.name} size="sm" />
                      <span>{user.name}</span>
                    </Link>
                    <span className="tag tag-quiet">Requested</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Heading({ count }) {
  return (
    <div className="reveal">
      <h1 className="page-title">Friends</h1>
      <p className="page-sub">
        {count
          ? `${count === 1 ? "1 friend" : `${count} friends`} can recommend things for your shelf.`
          : "Friends recommend things for your shelf and can see it even when it is private."}
      </p>
    </div>
  );
}
