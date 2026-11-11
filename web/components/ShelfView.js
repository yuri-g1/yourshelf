"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AddTile from "@/components/AddTile";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import Loading from "@/components/Loading";
import MovieCard from "@/components/MovieCard";
import MovieDetail from "@/components/MovieDetail";
import MovieForm from "@/components/MovieForm";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";
import { KIND_LIST, kindOf } from "@/lib/kinds";

const PREVIEW_SLOTS = 12;

export default function ShelfView({ userId }) {
  const api = useApi();
  const { user: me, loading: meLoading } = useAuth();
  const isSignedIn = Boolean(me);
  const [shelf, setShelf] = useState(null);
  const [locked, setLocked] = useState(null);
  const [relation, setRelation] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [kind, setKind] = useState("movie");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
            {visibility === "private"
              ? isOwner
                ? "Private. Only you and your friends can see it."
                : "Private shelf"
              : isOwner
                ? "Public. Anyone can see it."
                : "Public shelf"}
          </p>
          {shelf && (
            <p className="profile-stats">
              {KIND_LIST.map((item, index) => {
                const total = shelf[item.key].myShelf.length + shelf[item.key].recommended.length;

                return (
                  <span key={item.key}>
                    {index > 0 && <span aria-hidden="true"> · </span>}
                    <strong>{total}</strong> {total === 1 ? item.noun : item.plural}
                  </span>
                );
              })}
            </p>
          )}
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

  const config = kindOf(kind);
  const media = shelf[kind];
  const Noun = config.plural[0].toUpperCase() + config.plural.slice(1);

  const tabs = [
    { key: "all", label: "All", list: [...media.myShelf, ...media.recommended] },
    { key: "picks", label: isOwner ? "My picks" : "Picks", list: media.myShelf },
    { key: "friends", label: "From friends", list: media.recommended },
  ];
  const current = tabs.find((item) => item.key === tab) || tabs[0];

  const emptyCopy = {
    all: isOwner
      ? { title: `No ${config.plural} yet`, body: `Search for a ${config.noun} and add it to your picks.` }
      : { title: `No ${config.plural} yet`, body: "Check back later." },
    picks: isOwner
      ? { title: "No picks yet", body: `${Noun} you add yourself show up here.` }
      : { title: "No picks yet", body: `${owner.name} has not added anything yet.` },
    friends: isOwner
      ? { title: "No recommendations yet", body: "When friends recommend something, it shows up here." }
      : { title: "No recommendations yet", body: "Friends can recommend something for this shelf." },
  }[current.key];

  const addTile =
    (isOwner && current.key !== "friends" && { label: `Add a ${config.noun}` }) ||
    (canRecommend && current.key !== "picks" && { label: `Recommend to ${owner.name}` }) ||
    null;
  const limit = addTile ? PREVIEW_SLOTS - 1 : PREVIEW_SLOTS;
  const visible = expanded ? current.list : current.list.slice(0, limit);

  const library = (
    <section className="shelf-section">
      <div className="kind-switch" role="group" aria-label="Shelf type">
        {KIND_LIST.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={kind === item.key}
            className={kind === item.key ? "active" : ""}
            onClick={() => {
              setKind(item.key);
              setTab("all");
              setExpanded(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tabs" role="tablist" aria-label="Shelf sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={current.key === item.key}
            className={`tab-button ${current.key === item.key ? "active" : ""}`}
            onClick={() => {
              setTab(item.key);
              setExpanded(false);
            }}
          >
            {item.label}
            <span className="count">{item.list.length}</span>
          </button>
        ))}
      </div>

      {current.list.length === 0 && !addTile && (
        <div className="empty">
          <strong>{emptyCopy.title}</strong>
          <span>{emptyCopy.body}</span>
        </div>
      )}

      {(visible.length > 0 || addTile) && (
        <div className="movies" role="tabpanel">
          {visible.map((movie) => (
            <MovieCard key={movie._id} movie={movie} kind={kind} onOpen={setSelected} />
          ))}
          {addTile && <AddTile
              label={addTile.label}
              source={config.source}
              square={config.square}
              onClick={() => setAdding(true)}
            />}
        </div>
      )}

      {current.list.length > limit && (
        <div className="show-all">
          <button type="button" className="btn btn-small btn-soft" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : `Show all ${current.list.length}`}
          </button>
        </div>
      )}
    </section>
  );

  return (
    <>
      {header}

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-info">{notice}</div>}

      <div className="reveal reveal-2">
        {library}

        {friendCallout && <div style={{ marginTop: 40 }}>{friendCallout}</div>}
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} labelledBy="add-title" className="add-dialog">
        {isOwner ? (
          <MovieForm
            key={kind}
            kind={kind}
            title={`Add a ${config.noun}`}
            subtitle="It goes straight to your picks."
            submitLabel="Add to shelf"
            successMessage="Added. Add another or press Done."
            onDone={() => setAdding(false)}
            onSubmit={(form) =>
              api(`/shelf/${ownerId}/${kind}`, {
                method: "POST",
                body: {
                  title: form.title,
                  desc: form.desc,
                  externalId: form.externalId,
                  posterPath: form.posterPath,
                  creator: form.creator,
                },
              }).then(load)
            }
          />
        ) : (
          <MovieForm
            key={kind}
            kind={kind}
            title={`Recommend a ${config.noun} to ${owner.name}`}
            subtitle="It appears on their shelf with your note."
            submitLabel="Recommend"
            successMessage={`Sent to ${owner.name}. Recommend another or press Done.`}
            withNote
            onDone={() => setAdding(false)}
            onSubmit={(form) =>
              api(`/recommend/shelf/${ownerId}/${kind}`, {
                method: "POST",
                body: {
                  title: form.title,
                  desc: form.desc,
                  externalId: form.externalId,
                  posterPath: form.posterPath,
                  creator: form.creator,
                  recommendationText: form.note,
                },
              }).then(load)
            }
          />
        )}
      </Dialog>

      <MovieDetail
        movie={selected}
        kind={kind}
        recommenderHref={selected?.recommendedBy ? hrefFor(selected.recommendedBy._id) : null}
        canRemove={isOwner}
        onRemove={(item) => run(() => api(`/shelf/${ownerId}/${kind}/${item._id}`, { method: "DELETE" }))}
        onClose={() => setSelected(null)}
      />
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
