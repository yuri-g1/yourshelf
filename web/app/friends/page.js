"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";

export default function FriendsPage() {
  const api = useApi();
  const { user: me, loading } = useAuth();
  const isSignedIn = Boolean(me);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
    if (isSignedIn) load();
  }, [isSignedIn, load]);

  async function run(action) {
    setError("");

    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function answer(userId, state) {
    return run(() =>
      api("/update-relationship-state", {
        method: "POST",
        body: { userId, relationship_state: state },
      }),
    );
  }

  if (loading) return <Loading />;

  if (!isSignedIn) {
    return (
      <div className="empty">
        <strong>Sign in to see your friends</strong>
        <div>
          <Link href="/login" className="btn btn-small">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!data || !me) {
    return error ? <div className="alert alert-error">{error}</div> : <Loading label="Loading friends..." />;
  }

  const requests = data.requests.map((item) => item.from);
  const friends = data.relationships.filter((item) => item.status === "accepted");
  const sent = data.relationships.filter(
    (item) => item.status === "pending" && item.direction === "sent",
  );
  const busy = new Set(
    data.relationships.filter((item) => item.status !== "denied").map((item) => item.user?._id),
  );
  const suggestions = data.users.filter((user) => user._id !== me._id && !busy.has(user._id));

  return (
    <>
      <h1 className="page-title reveal">Friends</h1>
      <p className="page-sub reveal">
        Friends can recommend things for your shelf and see it even when it is private.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="friends-grid">
        <div className="stack reveal reveal-2">
          <div className={`panel ${requests.length ? "highlight" : ""}`}>
            <h2>Requests for you</h2>
            <p className="panel-sub">
              {requests.length
                ? "Accept to let them recommend things to you."
                : "Nothing waiting right now."}
            </p>
            {requests.length > 0 && (
              <div className="rows">
                {requests.map((user) => (
                  <div key={user._id} className="row-item">
                    <Person user={user} />
                    <div className="row-actions">
                      <button className="btn btn-small" onClick={() => answer(user._id, "accepted")}>
                        Accept
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => answer(user._id, "denied")}
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Your friends</h2>
            <p className="panel-sub">
              {friends.length ? `${friends.length} friends on yourshelf.` : "No friends yet."}
            </p>
            {friends.length > 0 && (
              <div className="rows">
                {friends.map(({ user }) => (
                  <div key={user._id} className="row-item">
                    <Person user={user} />
                    <div className="row-actions">
                      <Link href={`/shelf/${user._id}`} className="btn btn-small btn-soft">
                        Open shelf
                      </Link>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => answer(user._id, "denied")}
                      >
                        Unfriend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack reveal reveal-3">
          <div className="panel">
            <h2>Find people</h2>
            <p className="panel-sub">
              {suggestions.length ? "Send a request to start sharing." : "You know everyone here."}
            </p>
            {suggestions.length > 0 && (
              <div className="rows">
                {suggestions.map((user) => (
                  <div key={user._id} className="row-item">
                    <Person user={user} />
                    <button
                      className="btn btn-small"
                      onClick={() => run(() => api(`/friendship/${user._id}`, { method: "POST" }))}
                    >
                      Add friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Waiting for an answer</h2>
            <p className="panel-sub">
              {sent.length ? "Requests you sent." : "You have no open requests."}
            </p>
            {sent.length > 0 && (
              <div className="rows">
                {sent.map(({ user }) => (
                  <div key={user._id} className="row-item">
                    <Person user={user} />
                    <span className="tag">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Person({ user }) {
  return (
    <Link href={`/shelf/${user._id}`} className="row-person">
      <Avatar name={user.name} />
      <span>{user.name}</span>
    </Link>
  );
}
