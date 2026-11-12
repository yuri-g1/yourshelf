import Link from "next/link";
import LegalPage, { Contact } from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service | yourshelf",
  description: "The rules for using yourshelf.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for using yourshelf, in plain language. By creating an account or using the site, you agree to them."
    >
      <section>
        <h2>About yourshelf</h2>
        <p>
          yourshelf is a free, non-commercial personal project run by an independent developer (&quot;we&quot;,
          &quot;us&quot;). It lets you keep a shelf of the movies, games, books and albums you love, and lets your
          friends recommend things to you. How we handle your data is explained in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Who can use it</h2>
        <p>
          You must be at least 13 years old, or the minimum age for using online services without a parent&apos;s
          consent where you live if that is higher. If you use yourshelf on behalf of someone else, you confirm you
          are allowed to.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Give us a real email address that you control. It&apos;s how we verify requests about your account.</li>
          <li>Keep your password to yourself. You&apos;re responsible for what happens under your account.</li>
          <li>
            Pick a username that doesn&apos;t impersonate someone else, infringe a trademark or contain anything
            offensive. We may change or reclaim usernames that do.
          </li>
          <li>One account per person, and accounts may not be sold or transferred.</li>
          <li>Tell us right away if you think someone else has access to your account.</li>
        </ul>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          &quot;Your content&quot; means what you put on yourshelf: the items you add, your username and the notes you
          write when recommending something.
        </p>
        <ul>
          <li>You keep any rights you have in your content.</li>
          <li>
            You give us a free, worldwide, non-exclusive licence to store, copy and display your content only as needed
            to run yourshelf, for example to show your shelf to the people allowed to see it. This licence ends when
            you delete the content or your account, except for copies in backups that are deleted on their normal
            schedule.
          </li>
          <li>You&apos;re responsible for your content and must have the right to post it.</li>
          <li>
            Recommendations your friends make appear on your shelf. You can remove any of them, and you can remove a
            friend at any time.
          </li>
          <li>
            If your shelf is public, anyone can see it. Don&apos;t put anything there you want to keep private.
          </li>
        </ul>
      </section>

      <section>
        <h2>What you must not do</h2>
        <ul>
          <li>Harass, threaten, bully or impersonate anyone, including through recommendation notes.</li>
          <li>Post content that is illegal, hateful, sexually explicit, or that infringes someone else&apos;s rights.</li>
          <li>Share other people&apos;s personal information without their permission.</li>
          <li>Send spam or unwanted friend requests in bulk.</li>
          <li>
            Scrape, crawl or bulk download yourshelf, or use it to get around the terms of the catalog services we rely
            on.
          </li>
          <li>
            Probe, attack or overload the service, get around rate limits or security measures, or access accounts or
            data that aren&apos;t yours.
          </li>
          <li>Use yourshelf for any commercial purpose without our written permission.</li>
        </ul>
        <p>
          Found a security issue? Please report it privately to <Contact /> instead of exploiting it or posting it
          publicly.
        </p>
      </section>

      <section>
        <h2>Titles, covers and trademarks</h2>
        <p>
          Titles, descriptions, posters, covers and artwork come from third-party catalog services and belong to their
          respective owners. Movie data is provided by TMDB; this product uses the TMDB API but is not endorsed or
          certified by TMDB. yourshelf is not affiliated with, endorsed or sponsored by TMDB, IGDB, Twitch, Open
          Library, the Internet Archive, Deezer, MusicBrainz, fanart.tv, or any studio, publisher, label or platform
          shown on the site. Platform and format logos are trademarks of their owners and are shown only to identify
          the platform or format of an item. See the <Link href="/credits">Credits</Link> page for details.
        </p>
      </section>

      <section>
        <h2>Reporting content</h2>
        <p>
          If you think something on yourshelf infringes your copyright or other rights, or breaks these terms, contact
          us at <Contact /> with a link to it and an explanation. We&apos;ll review it and remove it if appropriate.
        </p>
      </section>

      <section>
        <h2>Suspending or closing accounts</h2>
        <p>
          You can stop using yourshelf and delete your account at any time from the account menu. We may remove content, or
          suspend or close an account, if it breaks these terms, puts other users or the service at risk, or if the
          law requires it. Where reasonable we&apos;ll tell you why.
        </p>
      </section>

      <section>
        <h2>Changes to the service</h2>
        <p>
          yourshelf is a hobby project, offered for free. We may add, change or remove features, or shut the service
          down. If we plan to shut it down, we&apos;ll try to give at least 30 days&apos; notice on the site so you
          can ask for a copy of your data.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          yourshelf is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind,
          express or implied, including that it will be uninterrupted, error-free or that data will never be lost.
          Information from catalog services may be incomplete or wrong. Keep your own copy of anything that matters to
          you.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, we are not liable for any indirect, incidental, special or
          consequential damages, or for lost data, profits or goodwill, arising from your use of yourshelf. Because the
          service is free, our total liability for all claims relating to yourshelf is limited to USD 50. Nothing in these terms limits liability that can&apos;t be limited by law, or
          your rights as a consumer under the mandatory laws of the country where you live.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms. We&apos;ll change the date at the top, and for significant changes we&apos;ll
          tell signed-in users on the site before they take effect. If you keep using yourshelf after that, the new
          terms apply; if you don&apos;t agree, you can stop using it and delete your account.
        </p>
      </section>

      <section>
        <h2>Open source</h2>
        <p>
          The yourshelf source code is released under the MIT License. That licence covers the code only; it
          doesn&apos;t give you any rights to user content, to third-party catalog data or to the yourshelf name and
          logo.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms: <Contact />.
        </p>
      </section>
    </LegalPage>
  );
}
