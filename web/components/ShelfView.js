"use client";

import Link from "next/link";
import { Check, GlobeHemisphereWest, LockSimple, UserPlus } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import AddTile from "@/components/AddTile";
import Bookcase from "@/components/Bookcase";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import MarkTrack from "@/components/MarkTrack";
import MovieCard from "@/components/MovieCard";
import MovieDetail from "@/components/MovieDetail";
import MovieForm from "@/components/MovieForm";
import { ShelfSkeleton } from "@/components/Skeletons";
import { useAuth } from "@/components/AuthProvider";
import { useApi } from "@/lib/api";
import { rememberShape } from "@/lib/shape";
import { authHref } from "@/lib/next";
import { KIND_LIST, kindOf } from "@/lib/kinds";

const PREVIEW_SLOTS = 12;
const OPEN_MS = 520;

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
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(null);
  const openTimer = useRef(null);

  const ownerId = userId || me?._id;
  const isOwner = Boolean(me && ownerId === me._id);
  const ready = !meLoading;
  const current = useRef(ownerId);
  current.current = ownerId;

  const load = useCallback(async () => {
    if (!ownerId) return;

    try {
      const next = await api(`/shelf/${ownerId}`);
      if (current.current !== ownerId) return;
      setShelf(next);
      setLocked(null);
    } catch (err) {
      if (current.current !== ownerId) return;
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
        if (current.current !== ownerId) return;
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
    setShelf(null);
    setLocked(null);
    setRelation(null);
    setError("");
    setNotice("");
    setExpanded(false);
  }, [ownerId]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  useEffect(() => () => clearTimeout(openTimer.current), []);

  useEffect(() => {
    const data = shelf || locked;
    if (!data || current.current !== ownerId) return;

    let shape = { name: data.owner.name, own: isOwner, locked: Boolean(locked) };
    if (shelf) {
      const total = shelf.movie.myShelf.length + shelf.movie.recommended.length;
      const limit = PREVIEW_SLOTS - 1;
      shape = { ...shape, slots: Math.min(total, limit) + 1, more: total > limit };
    }

    rememberShape(`shelf:${ownerId}`, shape);
    if (isOwner) rememberShape("shelf:me", shape);
  }, [shelf, locked, relation, isOwner, ownerId]);

  function openItem(movie) {
    if (opening) return;
    clearTimeout(openTimer.current);
    setOpening(movie._id);

    const hover = window.matchMedia("(hover: hover)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (hover || still) return setSelected(movie);

    openTimer.current = setTimeout(() => setSelected(movie), OPEN_MS);
  }

  function closeItem() {
    setSelected(null);
    setOpening(null);
  }

  async function run(action, message) {
    setError("");
    setNotice("");
    setBusy(true);

    try {
      await action();
      if (message) setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready || (!shelf && !locked && !error)) {
    return <ShelfSkeleton shapeKey={userId ? `shelf:${userId}` : "shelf:me"} />;
  }

  if (error && !shelf && !locked) {
    return (
      <div className="empty empty-cta" role="alert">
        <strong>This shelf could not load</strong>
        <span>{error}</span>
        <div>
          <button type="button" className="btn btn-small btn-soft" onClick={() => {
              setError("");
              load();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const owner = (shelf || locked).owner;
  const visibility = (shelf || locked).visibility;

  function hrefFor(id) {
    return me && id === me._id ? "/" : `/shelf/${id}`;
  }

  const friendAction = !isOwner && !locked && relation?.status !== "accepted" && (
    <FriendAction
      name={owner.name}
      relation={relation}
      signedIn={isSignedIn}
      busy={busy}
      onRequest={() =>
        run(
          () => api(`/friendship/${ownerId}`, { method: "POST" }),
          `Friend request sent to ${owner.name}.`,
        )
      }
    />
  );

  const counts = shelf && (
    <p className="profile-meta">
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
  );

  const header = (
    <div className="profile reveal">
      <div className="profile-id">
        <Avatar name={owner.name} size="lg" />
        <div>
          <h1>{isOwner ? "Your shelf" : `${owner.name}'s shelf`}</h1>
          {counts || <p className="profile-meta">Only {owner.name}'s friends can see this shelf.</p>}
        </div>
      </div>
      {friendAction}
    </div>
  );

  const isPrivate = visibility === "private";
  const VisibilityIcon = isPrivate ? LockSimple : GlobeHemisphereWest;

  const visibilityControl = isOwner ? (
    <button
      type="button"
      className="shelf-visibility"
      disabled={busy}
      title={isPrivate ? "Private: only you and your friends. Click to make it public." : "Public: anyone can see it. Click to make it private."}
      aria-label={isPrivate ? "Shelf is private. Make it public" : "Shelf is public. Make it private"}
      onClick={() => {
        const next = isPrivate ? "public" : "private";
        run(
          () => api("/me/shelf", { method: "PATCH", body: { visibility: next } }),
          next === "private"
            ? "Your shelf is now private. Only friends can see it."
            : "Your shelf is now public.",
        );
      }}
    >
      <VisibilityIcon size={22} weight="bold" />
    </button>
  ) : (
    <span
      className="shelf-visibility is-static"
      role="img"
      title={isPrivate ? "Private shelf" : "Public shelf"}
      aria-label={isPrivate ? "Private shelf" : "Public shelf"}
    >
      <VisibilityIcon size={22} weight="bold" />
    </span>
  );

  if (locked) {
    return (
      <>
        {header}
        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-info">{notice}</div>}

        <section className="shelf-section shelf-locked reveal reveal-2">
          <Bookcase kind="movie" crown={<div className="shelf-bar">{visibilityControl}</div>}>
            {[0, 1, 2, 3].map((tone, index) => (
              <div key={index} className="movie" aria-hidden="true">
                <span className="case case-movie plastic-black">
                  <span className="cover">
                    <span className={`poster poster-${tone}`} />
                  </span>
                </span>
                <span className="shelf-ledge" />
              </div>
            ))}
          </Bookcase>
          <LockedPrompt
            name={owner.name}
            relation={relation}
            signedIn={isSignedIn}
            busy={busy}
            onRequest={() =>
              run(
                () => api(`/friendship/${ownerId}`, { method: "POST" }),
                `Friend request sent to ${owner.name}.`,
              )
            }
          />
        </section>
      </>
    );
  }

  const canRecommend = !isOwner && relation?.status === "accepted";

  const config = kindOf(kind);
  const media = shelf[kind];
  const items = [...media.myShelf, ...media.recommended];

  const emptyCopy = isOwner
    ? { title: `No ${config.plural} yet`, body: `Search for a ${config.noun} and add it to your shelf.` }
    : { title: `No ${config.plural} yet`, body: "Check back later." };

  const addTile =
    (isOwner && { label: `Add a ${config.noun}` }) ||
    (canRecommend && { label: `Recommend to ${owner.name}` }) ||
    { label: lockedTileLabel(owner.name, relation, isSignedIn), locked: true };
  const limit = addTile ? PREVIEW_SLOTS - 1 : PREVIEW_SLOTS;
  const visible = expanded ? items : items.slice(0, limit);

  const library = (
    <section className="shelf-section">
      <Bookcase
        kind={kind}
        square={config.square}
        crown={
          <div className="shelf-bar">
            <MarkTrack className="kind-switch" role="group" aria-label="Shelf type" watch={kind}>
              {KIND_LIST.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={kind === item.key}
                  className={kind === item.key ? "active" : ""}
                  onClick={() => {
                    setKind(item.key);
                    setExpanded(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </MarkTrack>
            {visibilityControl}
          </div>
        }
        empty={
          <>
            <strong>{emptyCopy.title}</strong>
            <span>{emptyCopy.body}</span>
          </>
        }
      >
        {visible.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={movie}
            kind={kind}
            state={opening === movie._id ? "open" : undefined}
            onOpen={openItem}
          />
        ))}
        {addTile && (
          <AddTile
            label={addTile.label}
            source={config.source}
            kind={kind}
            locked={addTile.locked}
            onClick={() => setAdding(true)}
          />
        )}
      </Bookcase>

      {items.length > limit && (
        <div className="show-all">
          <button type="button" className="btn btn-small btn-soft" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : `Show all ${items.length}`}
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
      </div>

      <Dialog open={adding} onClose={() => setAdding(false)} labelledBy="add-title" className="add-dialog">
        {isOwner ? (
          <MovieForm
            key={kind}
            kind={kind}
            title={`Add a ${config.noun}`}
            subtitle={`Search ${config.source}, or add your own.`}
            submitLabel="Add to shelf"
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
            subtitle="It lands on their shelf with your note."
            submitLabel="Recommend"
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
        onClose={closeItem}
      />
    </>
  );
}

function LockedPrompt({ name, relation, signedIn, busy, onRequest }) {
  let title = `Add ${name} to see their shelf`;
  let action = (
    <button type="button" className="btn" onClick={onRequest} disabled={busy}>
      {busy ? "Sending..." : "Add friend"}
    </button>
  );

  if (!signedIn) {
    title = `Sign in and add ${name} to see their shelf`;
    action = (
      <Link href={authHref("login", window.location.pathname)} className="btn">
        Sign in
      </Link>
    );
  } else if (relation?.status === "pending" && relation.direction === "sent") {
    title = `Request sent. You'll see ${name}'s shelf once they accept.`;
    action = null;
  } else if (relation?.status === "pending") {
    title = `${name} wants to be friends`;
    action = (
      <Link href="/friends" className="btn">
        Answer request
      </Link>
    );
  }

  return (
    <div className="locked-prompt">
      <LockSimple size={28} weight="bold" aria-hidden="true" />
      <strong>{title}</strong>
      {action}
    </div>
  );
}

function lockedTileLabel(name, relation, signedIn) {
  if (!signedIn) return `Sign in and add ${name} to recommend`;
  if (relation?.status === "pending" && relation.direction === "sent") return `Recommend once ${name} accepts`;
  if (relation?.status === "pending") return `Accept ${name} to recommend`;
  return `Add ${name} as a friend to recommend`;
}

function FriendAction({ name, relation, signedIn, busy, onRequest }) {
  let action = (
    <button type="button" className="btn btn-small" onClick={onRequest} disabled={busy}>
      <UserPlus size={18} weight="bold" aria-hidden="true" />
      {busy ? "Sending..." : "Add friend"}
    </button>
  );

  if (!signedIn) {
    action = (
      <Link href={authHref("login", window.location.pathname)} className="btn btn-small">
        <UserPlus size={18} weight="bold" aria-hidden="true" />
        Add friend
      </Link>
    );
  } else if (relation?.status === "pending" && relation.direction === "sent") {
    action = (
      <span className="status">
        <Check size={16} weight="bold" aria-hidden="true" />
        Request sent
      </span>
    );
  } else if (relation?.status === "pending") {
    action = (
      <Link href="/friends" className="btn btn-small">
        <UserPlus size={18} weight="bold" aria-hidden="true" />
        Answer request
      </Link>
    );
  }

  return <div className="profile-action">{action}</div>;
}
