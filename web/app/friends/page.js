"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { demo, findUser, relationsOf, useDemo } from "@/lib/demo";

export default function FriendsPage() {
  const data = useDemo();
  const [error, setError] = useState("");

  const mine = relationsOf(data, data.me).map((relation) => ({
    ...relation,
    user: findUser(data, relation.other),
  }));

  const requests = mine.filter((item) => item.status === "pending" && item.direction === "received");
  const friends = mine.filter((item) => item.status === "accepted");
  const sent = mine.filter((item) => item.status === "pending" && item.direction === "sent");
  const busy = new Set(mine.filter((item) => item.status !== "denied").map((item) => item.other));
  const suggestions = data.users.filter((user) => user._id !== data.me && !busy.has(user._id));

  function run(action) {
    setError("");

    try {
      action();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1 className="page-title reveal">Friends</h1>
      <p className="page-sub reveal">
        Friends can recommend things for your shelf. Lorem ipsum dolor sit amet.
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
                {requests.map(({ user }) => (
                  <div key={user._id} className="row-item">
                    <Person user={user} />
                    <div className="row-actions">
                      <button
                        className="btn btn-small"
                        onClick={() => run(() => demo.answer(user._id, "accepted"))}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => run(() => demo.answer(user._id, "denied"))}
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
                        onClick={() => run(() => demo.answer(user._id, "denied"))}
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
                      onClick={() => run(() => demo.sendRequest(user._id))}
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
