import Link from "next/link";
import LegalPage, { Contact } from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy | yourshelf",
  description: "What yourshelf collects, why, who can see it and how to get it deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="yourshelf collects as little as it can: what you need to sign in and what you put on your shelf. No ads, no analytics, no tracking."
    >
      <section>
        <h2>The short version</h2>
        <ul>
          <li>We store your username, email, a scrambled (hashed) version of your password, your shelf and your friendships.</li>
          <li>Your username is visible to everyone. Your email never is.</li>
          <li>Public shelves can be seen by anyone; private shelves only by you and your accepted friends.</li>
          <li>We use one cookie, to keep you signed in. No analytics, advertising or tracking cookies.</li>
          <li>We don&apos;t sell or rent your data, and we don&apos;t use it for advertising.</li>
          <li>You can delete your account yourself at any time, and ask us for a copy of your data.</li>
        </ul>
      </section>

      <section>
        <h2>Who we are</h2>
        <p>
          yourshelf is a personal, non-commercial project run by an independent developer (&quot;we&quot;,
          &quot;us&quot;). We are the controller of the personal data described here. You can reach us at <Contact />.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details:</strong> your username, your email address and your password. The password is
            never stored as you typed it; we keep only a salted scrypt hash of it, which can&apos;t be turned back into
            the password.
          </li>
          <li>
            <strong>Your shelf:</strong> the movies, games, books and albums you add (title, synopsis, cover, creator
            and the catalog id they came from) and whether your shelf is public or private.
          </li>
          <li>
            <strong>Recommendations:</strong> when you recommend something to a friend, we store the item, the
            optional note you write and the fact that it came from you. It is saved on your friend&apos;s shelf.
          </li>
          <li>
            <strong>Friendships:</strong> the friend requests you send and receive and whether they are pending,
            accepted or denied.
          </li>
          <li>
            <strong>Searches:</strong> what you type in the search boxes, which we pass on to the catalog services
            listed below to find matching titles. We don&apos;t keep a history of your searches.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Session cookie:</strong> when you sign in we set a cookie named <code>sid</code> holding a random
            token. We store only a SHA-256 hash of that token, linked to your account, so we know the requests are
            yours.
          </li>
          <li>
            <strong>IP address and request data:</strong> we use your IP address in memory to limit sign-up and
            sign-in attempts and stop abuse. These counters are not written to the database and disappear within an
            hour. Our hosting providers also keep standard server logs (IP address, browser, pages requested, time)
            for security and troubleshooting.
          </li>
          <li>
            <strong>Local storage:</strong> the site stores a single flag (<code>yourshelf:signed-in</code>) in your
            browser that remembers whether you were signed in last time, so it can show the right placeholder while
            the page loads. It contains no personal data and never leaves your device.
          </li>
        </ul>
        <p>
          We do not use analytics, advertising pixels, fingerprinting or third-party trackers, and we don&apos;t
          collect your location, contacts or payment details.
        </p>
      </section>

      <section>
        <h2>How we use it, and why we&apos;re allowed to</h2>
        <ul>
          <li>
            <strong>To run the service you signed up for</strong> (create your account, sign you in, show your shelf,
            let friends recommend things). Legal basis: performance of our agreement with you.
          </li>
          <li>
            <strong>To keep yourshelf secure</strong> (rate limits, locking an account after repeated failed sign-ins,
            investigating abuse). Legal basis: our legitimate interest in protecting the service and its users.
          </li>
          <li>
            <strong>To answer you</strong> when you contact us, and to tell you about important changes to these
            terms. Legal basis: our legitimate interest, or a legal obligation where one applies.
          </li>
        </ul>
        <p>
          We don&apos;t send marketing emails and we don&apos;t use your data for automated decisions that have legal
          or similarly significant effects on you.
        </p>
      </section>

      <section>
        <h2>Who can see what</h2>
        <ul>
          <li>
            <strong>Your username</strong> is public. It appears in the list of people on yourshelf (even if your
            shelf is private), on your shelf and next to recommendations you make.
          </li>
          <li>
            <strong>A public shelf</strong>, including the notes on recommendations and who made them, can be seen by
            anyone, including people who are not signed in, and could be indexed by search engines.
          </li>
          <li>
            <strong>A private shelf</strong> can be seen only by you and your accepted friends.
          </li>
          <li>
            <strong>Recommendations you make</strong> follow the visibility of your friend&apos;s shelf, not yours.
          </li>
          <li>
            <strong>Your email address and password hash</strong> are never shown to anyone, including your friends.
          </li>
        </ul>
        <p>You can switch your shelf between public and private at any time from your shelf.</p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We don&apos;t sell, rent or trade your personal data. We share it only with:</p>
        <h3>Service providers that run yourshelf for us</h3>
        <ul>
          <li><strong>Vercel</strong> hosts the website.</li>
          <li><strong>Render</strong> hosts the API server.</li>
          <li><strong>MongoDB Atlas</strong> (MongoDB, Inc.) hosts the database where your account and shelf live.</li>
        </ul>
        <p>
          They process data only to provide their service to us, under their own data protection terms.
        </p>

        <h3>Catalog services</h3>
        <p>
          Titles, covers and artwork come from{" "}
          <a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer">TMDB</a>{" "}
          (movies),{" "}
          <a href="https://www.igdb.com/privacy" target="_blank" rel="noopener noreferrer">IGDB</a>{" "}
          (games, run by Twitch),{" "}
          <a href="https://archive.org/about/terms" target="_blank" rel="noopener noreferrer">Open Library</a>{" "}
          (books, run by the Internet Archive),{" "}
          <a href="https://www.deezer.com/legal/personal-datas" target="_blank" rel="noopener noreferrer">Deezer</a>{" "}
          (albums),{" "}
          <a href="https://fanart.tv" target="_blank" rel="noopener noreferrer">fanart.tv</a> (disc artwork) and{" "}
          <a href="https://metabrainz.org/privacy" target="_blank" rel="noopener noreferrer">MusicBrainz</a>{" "}
          (album lookups).
        </p>
        <ul>
          <li>
            <strong>Searches and lookups</strong> are made by our server, so these services see the search text and
            our server&apos;s address, not your account or your IP address.
          </li>
          <li>
            <strong>Cover images</strong> are loaded by your browser directly from these services&apos; image servers,
            so they receive your IP address and browser details the same way any website you visit does. Their own
            privacy policies apply to that.
          </li>
        </ul>

        <h3>When the law requires it</h3>
        <p>
          We may disclose data if we are legally required to, or if it&apos;s necessary to protect the rights, safety
          or property of our users, the public or yourshelf.
        </p>
      </section>

      <section>
        <h2>International transfers</h2>
        <p>
          Our providers may store and process data in the United States and other countries outside where you live.
          Where data protection law requires it, these transfers rely on safeguards such as the European
          Commission&apos;s Standard Contractual Clauses offered by those providers.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>Your account and shelf:</strong> until you delete your account. Deletion is immediate and
            permanent.
          </li>
          <li>
            <strong>Recommendations you made to friends:</strong> while they stay on your friend&apos;s shelf. If you
            delete your account, they are deleted too.
          </li>
          <li><strong>Sessions:</strong> 30 days, or until you sign out, whichever comes first.</li>
          <li><strong>Rate-limit and failed sign-in counters:</strong> in memory only, for up to one hour.</li>
          <li>
            <strong>Server logs and backups</strong> kept by our providers: for their standard retention periods,
            after which they are deleted.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we protect it</h2>
        <p>
          Passwords are hashed with scrypt and a unique salt. Session tokens are random and stored only as hashes, in
          cookies that scripts can&apos;t read (<code>HttpOnly</code>) and that are sent only over HTTPS. Sign-in
          attempts are rate-limited. No system is perfectly secure, though; if we learn of a breach that affects your
          data, we will tell you and the relevant authorities as the law requires.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>Depending on where you live (for example under the GDPR, the UK GDPR, Brazil&apos;s LGPD or California&apos;s CCPA), you have the right to:</p>
        <ul>
          <li>know what data we hold about you and get a copy of it, in a portable format;</li>
          <li>correct data that is wrong;</li>
          <li>have your data deleted;</li>
          <li>object to or ask us to restrict some uses of it;</li>
          <li>withdraw any consent you gave;</li>
          <li>complain to your data protection authority.</li>
        </ul>
        <p>
          You can remove items from your shelf, make your shelf private and remove friends yourself. To delete your
          account, open the account menu (your avatar, top right) and choose <strong>Delete account</strong>. This
          permanently deletes your account, shelf, friendships and the recommendations you made. For anything else,
          contact us at <Contact /> from the email address on your account. We will answer within 15 days. We don&apos;t charge for this and we won&apos;t treat you differently
          for asking.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          yourshelf is not meant for children under 13, or under the minimum age for consenting to online services
          where you live if that is higher. We don&apos;t knowingly collect data from them. If you believe a child has
          created an account, contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          The only cookie yourshelf sets is <code>sid</code>, which keeps you signed in. It is strictly necessary for
          the service you asked for, so it doesn&apos;t need a consent banner. It expires after 30 days or when you
          sign out. You can block or delete cookies in your browser, but you won&apos;t be able to stay signed in.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If we change this policy we&apos;ll update the date at the top of the page. If the change is significant,
          we&apos;ll tell signed-in users on the site before it takes effect.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions or requests about your data: <Contact />. See also our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
