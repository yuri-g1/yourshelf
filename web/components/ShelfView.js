"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import MovieCard from "@/components/MovieCard";
import MovieForm from "@/components/MovieForm";
import { demo, findRelation, findUser, relationsOf, useDemo } from "@/lib/demo";

export default function ShelfView({ userId }) {
  const data = useDemo();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const ownerId = userId || data.me;
  const owner = findUser(data, ownerId);
  const isOwner = ownerId === data.me;

  if (!owner) {
    return (
      <div className="empty">
        <strong>This shelf does not exist</strong>
        <span>
          Go back to <Link href="/">your shelf</Link>.
        </span>
      </div>
    );
  }

  const movies = data.movies[ownerId] || [];
  const picks = movies.filter((movie) => !movie.recommendedBy);
  const recommended = movies.filter((movie) => movie.recommendedBy);
  const relation = isOwner ? null : findRelation(data, data.me, ownerId);
  const friendCount = relationsOf(data, ownerId).filter(
    (item) => item.status === "accepted",
  ).length;

  function hrefFor(id) {
    return id === data.me ? "/" : `/shelf/${id}`;
  }

  function run(action, message) {
    setError("");
    setNotice("");

    try {
      action();
      if (message) setNotice(message);
    } catch (err) {
      setError(err.message);
    }
  }

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
            {list.map((movie) => {
              const recommender = movie.recommendedBy
                ? findUser(data, movie.recommendedBy)
                : null;

              return (
                <MovieCard
                  key={movie._id}
                  movie={movie}
                  recommender={recommender}
                  recommenderHref={recommender ? hrefFor(recommender._id) : null}
                  canRemove={isOwner}
                  onRemove={(item) => run(() => demo.removeMovie(item._id))}
                />
              );
            })}
          </div>
        )}
      </section>
    );
  }

  const canRecommend = relation?.status === "accepted";

  return (
    <>
      <div className="profile reveal">
        <div className="profile-id">
          <Avatar name={owner.name} size="lg" />
          <div>
            <h1>{isOwner ? "Your shelf" : `${owner.name}'s shelf`}</h1>
            <p className="profile-meta">
              {isOwner
                ? "Lorem ipsum dolor sit amet, everything you love in one place."
                : "Consectetur adipiscing elit, a friend's picks."}
            </p>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>{movies.length}</strong>
            <span>movies</span>
          </div>
          <div className="stat">
            <strong>{friendCount}</strong>
            <span>friends</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}

      <div className={`shelf-layout ${isOwner || canRecommend ? "has-aside" : ""}`}>
        <div className="reveal reveal-2">
          {!isOwner && !canRecommend && (
            <FriendCallout
              name={owner.name}
              relation={relation}
              meId={data.me}
              onRequest={() =>
                run(() => demo.sendRequest(ownerId), `Friend request sent to ${owner.name}.`)
              }
            />
          )}

          {renderSection(
            isOwner ? "My picks" : `${owner.name}'s picks`,
            picks,
            isOwner
              ? { title: "Your shelf is empty", body: "Add your first movie with the form." }
              : { title: "Nothing here yet", body: "Lorem ipsum, check back later." },
          )}

          {renderSection("Recommended by friends", recommended, {
            title: "No recommendations yet",
            body: isOwner
              ? "When friends recommend a movie, it shows up here."
              : "Be the first friend to recommend something.",
          })}
        </div>

        {isOwner && (
          <aside className="aside reveal reveal-3">
            <MovieForm
              title="Add a movie"
              subtitle="It goes straight to your picks."
              submitLabel="Add to shelf"
              onSubmit={(form) => demo.addMovie(form)}
            />
          </aside>
        )}

        {!isOwner && canRecommend && (
          <aside className="aside reveal reveal-3">
            <MovieForm
              title={`Recommend to ${owner.name}`}
              subtitle="It appears on their shelf with your note."
              submitLabel="Recommend"
              withNote
              onSubmit={(form) => {
                demo.recommend(ownerId, form);
                setNotice(`Recommendation sent to ${owner.name}.`);
              }}
            />
          </aside>
        )}
      </div>
    </>
  );
}

function FriendCallout({ name, relation, meId, onRequest }) {
  let body;

  if (!relation || relation.status === "denied") {
    body = (
      <>
        <span>Become friends with {name} to recommend something for their shelf.</span>
        <div>
          <button className="btn btn-small" onClick={onRequest}>
            Add friend
          </button>
        </div>
      </>
    );
  } else if (relation.from === meId) {
    body = <span>Your friend request is waiting for {name} to answer.</span>;
  } else {
    body = (
      <>
        <span>{name} sent you a friend request.</span>
        <div>
          <Link href="/friends" className="btn btn-small btn-soft">
            Answer request
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="empty" style={{ marginBottom: 40 }}>
      <strong>You are not friends yet</strong>
      {body}
    </div>
  );
}
