"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import MovieCard from "@/components/MovieCard";
import MovieForm from "@/components/MovieForm";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";

export default function ShelfView({ userId }) {
  const api = useApi();
  const { user: me, loading: meLoading } = useAuth();
  const isSignedIn = Boolean(me);
  const [shelf, setShelf] = useState(null);
  const [locked, setLocked] = useState(null);
  const [relation, setRelation] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const ownerId = userId || me?._id;
  const isOwner = Boolean(me && ownerId === me._id);
  const ready = !meLoading;

  const load = useCallback(async () => {
    if (!ownerId) return;

    try {
      setShelf(await api(`/shelf/${ownerId}`));
      setLocked(null);
    } catch (err) {
      if (err.status === 403 && err.data?.owner) {
        setLocked(err.data);
        setShelf(null);
      } else {
        setError(err.message);
      }
    }

    if (me && me._id !== ownerId) {
      try {
        const relationships = await api("/relationships");
        setRelation(
          relationships.find(
            (item) => item.user?._id === ownerId && item.status !== "denied",
          ) || null,
        );
      } catch {
        setRelation(null);
      }
    } else {
      setRelation(null);
    }
  }, [api, ownerId, me]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function run(action, message) {
    setError("");
    setNotice("");

    try {
      await action();
      if (message) setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready || (!shelf && !locked && !error)) {
    return <Loading label="Loading shelf..." />;
  }

  if (error && !shelf && !locked) {
    return <div className="alert alert-error">{error}</div>;
  }

  const owner = (shelf || locked).owner;
  const visibility = (shelf || locked).visibility;

  function hrefFor(id) {
    return me && id === me._id ? "/" : `/shelf/${id}`;
  }

  const friendCallout = !isOwner && relation?.status !== "accepted" && (
    <FriendCallout
      name={owner.name}
      relation={relation}
      signedIn={isSignedIn}
      onRequest={() =>
        run(
          () => api(`/friendship/${ownerId}`, { method: "POST" }),
          `Friend request sent to ${owner.name}.`,
        )
      }
    />
  );

  const header = (
    <div className="profile reveal">
      <div className="profile-id">
        <Avatar name={owner.name} size="lg" />
        <div>
          <h1>{isOwner ? "Your shelf" : `${owner.name}'s shelf`}</h1>
          <p className="profile-meta">
            {visibility === "private" ? "Private shelf" : "Public shelf"}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="segmented" role="group" aria-label="Shelf visibility">
          {["public", "private"].map((option) => (
            <button
              key={option}
              className={visibility === option ? "active" : ""}
              aria-pressed={visibility === option}
              onClick={() =>
                visibility !== option &&
                run(
                  () =>
                    api("/me/shelf", {
                      method: "PATCH",
                      body: { visibility: option },
                    }),
                  option === "private"
                    ? "Your shelf is now private. Only friends can see it."
                    : "Your shelf is now public.",
                )
              }
            >
              {option === "public" ? "Public" : "Private"}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (locked) {
    return (
      <>
        {header}
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-info">{notice}</div>}
        <div className="empty">
          <strong>This shelf is private</strong>
          <span>Only {owner.name} and their friends can see it.</span>
        </div>
        <div style={{ marginTop: 24 }}>{friendCallout}</div>
      </>
    );
  }

  const canRecommend = !isOwner && relation?.status === "accepted";

  function renderSection(title, list, empty) {
    return (
      <section className="shelf-section">
        <div className="section-head">
          <h2>{title}</h2>
          <span className="count">{list.length}</span>
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <strong>{empty.title}</strong>
            <span>{empty.body}</span>
          </div>
        ) : (
          <div className="movies">
            {list.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                recommender={movie.recommendedBy}
                recommenderHref={
                  movie.recommendedBy ? hrefFor(movie.recommendedBy._id) : null
                }
                canRemove={isOwner}
                onRemove={(item) =>
                  run(() =>
                    api(`/shelf/${ownerId}/movie/${item._id}`, {
                      method: "DELETE",
                    }),
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {header}

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}

      <div
        className={`shelf-layout ${isOwner || canRecommend ? "has-aside" : ""}`}
      >
        <div className="reveal reveal-2">
          {friendCallout && (
            <div style={{ marginBottom: 40 }}>{friendCallout}</div>
          )}

          {renderSection(
            isOwner ? "My picks" : `${owner.name}'s picks`,
            shelf.myShelf,
            isOwner
              ? {
                  title: "Your shelf is empty",
                  body: "Add your first movie with the form.",
                }
              : { title: "Nothing here yet", body: "Check back later." },
          )}

          {renderSection("Recommended by friends", shelf.recommended, {
            title: "No recommendations yet",
            body: isOwner
              ? "When friends recommend something, it shows up here."
              : "Friends can recommend something for this shelf.",
          })}
        </div>

        {isOwner && (
          <aside className="aside reveal reveal-3">
            <MovieForm
              title="Add a movie"
              subtitle="It goes straight to your picks."
              submitLabel="Add to shelf"
              onSubmit={(form) =>
                api(`/shelf/${ownerId}/movie`, {
                  method: "POST",
                  body: { title: form.title, desc: form.desc },
                }).then(load)
              }
            />
          </aside>
        )}

        {canRecommend && (
          <aside className="aside reveal reveal-3">
            <MovieForm
              title={`Recommend to ${owner.name}`}
              subtitle="It appears on their shelf with your note."
              submitLabel="Recommend"
              withNote
              onSubmit={(form) =>
                api(`/recommend/shelf/${ownerId}/movie`, {
                  method: "POST",
                  body: {
                    title: form.title,
                    desc: form.desc,
                    recommendationText: form.note,
                  },
                }).then(() => {
                  setNotice(`Recommendation sent to ${owner.name}.`);
                  return load();
                })
              }
            />
          </aside>
        )}
      </div>
    </>
  );
}

function FriendCallout({ name, relation, signedIn, onRequest }) {
  if (!signedIn) {
    return (
      <div className="empty">
        <strong>Want to recommend something to {name}?</strong>
        <span>Sign in and send a friend request.</span>
        <div>
          <Link href="/login" className="btn btn-small">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (relation?.status === "pending" && relation.direction === "sent") {
    return (
      <div className="empty">
        <strong>Request sent</strong>
        <span>Waiting for {name} to answer.</span>
      </div>
    );
  }

  if (relation?.status === "pending") {
    return (
      <div className="empty">
        <strong>{name} sent you a friend request</strong>
        <div>
          <Link href="/friends" className="btn btn-small btn-soft">
            Answer request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="empty">
      <strong>You are not friends yet</strong>
      <span>
        Become friends with {name} to recommend something for their shelf.
      </span>
      <div>
        <button className="btn btn-small" onClick={onRequest}>
          Add friend
        </button>
      </div>
    </div>
  );
}
