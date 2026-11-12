import Link from "next/link";
import { LockSimple } from "@phosphor-icons/react";
import Avatar from "@/components/Avatar";
import Poster from "@/components/Poster";
import { KIND_LIST } from "@/lib/kinds";

const STRIP = 4;

export function countsLine(preview) {
  if (!preview) return "Private shelf";

  const parts = KIND_LIST.map((kind) => ({ kind, count: preview.counts[kind.key] || 0 }))
    .filter(({ count }) => count > 0)
    .map(({ kind, count }) => `${count} ${count === 1 ? kind.noun : kind.plural}`);

  return parts.length ? parts.join(", ") : "Empty shelf";
}

export function totalOf(preview) {
  return Object.values(preview?.counts || {}).reduce((sum, count) => sum + count, 0);
}

// A person and the latest covers on their shelf. The name link stretches
// over the whole card; `action` and `footer` sit above it so their buttons
// stay clickable.
export default function PersonCard({ user, preview = user.preview, action, footer, className = "" }) {
  const slots = Array.from({ length: STRIP }, (_, index) => preview?.posters[index]);

  return (
    <article className={`person-card person-preview ${className}`}>
      <div className="person-head">
        <Avatar name={user.name} />
        <div className="person-id">
          <Link href={`/shelf/${user._id}`} className="person-link">
            {user.name}
          </Link>
          <p className="person-stats">{countsLine(preview)}</p>
        </div>
        {action && <div className="person-action">{action}</div>}
      </div>

      {preview ? (
        <div className="person-posters" aria-hidden="true">
          {slots.map((item, index) =>
            item ? (
              <Poster key={index} title={item.title} posterPath={item.posterPath} kind={item.kind} />
            ) : (
              <span key={index} className="person-posters-empty" />
            ),
          )}
        </div>
      ) : (
        <div className="person-posters person-posters-locked" aria-hidden="true">
          <LockSimple size={20} weight="bold" />
        </div>
      )}

      {footer && <div className="person-footer">{footer}</div>}
    </article>
  );
}
