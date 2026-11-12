"use client";

import Link from "next/link";
import { GlobeHemisphereWest, LockSimple } from "@phosphor-icons/react";
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
import { KIND_LIST, kindOf } from "@/lib/kinds";

const PREVIEW_SLOTS = 12;
// how long the cover swings before the details appear on touch screens
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
  // the case that is swinging open (or stays open behind the dialog)
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

  // moving from one shelf to another must not show the previous owner's
  // shelf while the next one loads
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

  // On touch screens there is no hover to open a case, so a tap first swings
  // the cover open and the details follow once the disc is showing. With a
  // mouse the case is already open from hovering, so the dialog comes at once.
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
    return <ShelfSkeleton />;
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

  const friendCallout = !isOwner && relation?.status !== "accepted" && (
    <FriendCallout
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
    </div>
  );

  const isPrivate = visibility === "private";
  const VisibilityIcon = isPrivate ? LockSimple : GlobeHemisphereWest;

  // globe or lock, aligned with the kind tabs; on your own shelf it toggles
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
  // one shelf per kind: your own picks first, then what friends recommended
  const items = [...media.myShelf, ...media.recommended];

  const emptyCopy = isOwner
    ? { title: `No ${config.plural} yet`, body: `Search for a ${config.noun} and add it to your shelf.` }
    : { title: `No ${config.plural} yet`, body: "Check back later." };

  const addTile =
    (isOwner && { label: `Add a ${config.noun}` }) ||
    (canRecommend && { label: `Recommend to ${owner.name}` }) ||
    null;
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
      <Link href="/login" className="btn">
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

function FriendCallout({ name, relation, signedIn, busy, onRequest }) {
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
        <button className="btn btn-small" onClick={onRequest} disabled={busy}>
          {busy ? "Sending..." : "Add friend"}
        </button>
      </div>
    </div>
  );
}
