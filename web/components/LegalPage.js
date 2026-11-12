import { CONTACT_EMAIL, LAST_UPDATED, OPERATOR_URL } from "@/lib/legal";

export default function LegalPage({ title, intro, children }) {
  return (
    <article className="legal reveal">
      <header className="legal-head">
        <h1 className="page-title">{title}</h1>
        <p className="legal-updated">Last updated {LAST_UPDATED}</p>
        {intro && <p className="page-sub">{intro}</p>}
      </header>
      <div className="legal-body">{children}</div>
    </article>
  );
}

export function Contact() {
  if (CONTACT_EMAIL) {
    return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  }

  return (
    <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer">
      the developer&apos;s GitHub profile
    </a>
  );
}
