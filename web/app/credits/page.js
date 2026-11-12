import LegalPage from "@/components/LegalPage";
import { SOURCE_URL } from "@/lib/legal";

export const metadata = {
  title: "Credits | yourshelf",
  description: "Where yourshelf's data, artwork, fonts and icons come from, and their licences.",
};

function Ext({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function CreditsPage() {
  return (
    <LegalPage
      title="Credits"
      intro="yourshelf stands on a lot of generous shoulders. Here's where the data, artwork, fonts and icons come from."
    >
      <section>
        <h2>Catalog data and covers</h2>
        <ul>
          <li>
            <strong>Movies:</strong> data and posters from <Ext href="https://www.themoviedb.org">TMDB</Ext>. This
            product uses the TMDB API but is not endorsed or certified by TMDB.
          </li>
          <li>
            <strong>Games:</strong> data and covers from <Ext href="https://www.igdb.com">IGDB</Ext>, via the Twitch
            API.
          </li>
          <li>
            <strong>Books:</strong> data and covers from <Ext href="https://openlibrary.org">Open Library</Ext>, a
            project of the Internet Archive.
          </li>
          <li>
            <strong>Albums:</strong> data and covers from <Ext href="https://www.deezer.com">Deezer</Ext>.
          </li>
          <li>
            <strong>Disc artwork and title logos:</strong> from <Ext href="https://fanart.tv">fanart.tv</Ext>, made
            by its community of contributors. Album releases are matched with{" "}
            <Ext href="https://musicbrainz.org">MusicBrainz</Ext> data (CC0).
          </li>
        </ul>
        <p>
          All titles, posters, covers and artwork belong to their respective owners. yourshelf is not affiliated with
          or endorsed by any of these services.
        </p>
      </section>

      <section>
        <h2>Logos and textures</h2>
        <ul>
          <li>
            PlayStation logos from <Ext href="https://simpleicons.org">Simple Icons</Ext> (CC0). Blu-ray Disc, Nintendo
            Switch and Xbox logos from <Ext href="https://commons.wikimedia.org">Wikimedia Commons</Ext> (public
            domain). They are trademarks of their owners and are shown only to identify the platform or format of an
            item.
          </li>
          <li>
            Wood textures &quot;Oak Veneer 01&quot; by Jenelle van Heerden and &quot;Fine Grained Wood&quot; by Rob
            Tuytel, from <Ext href="https://polyhaven.com">Poly Haven</Ext> (CC0).
          </li>
        </ul>
      </section>

      <section>
        <h2>Type and icons</h2>
        <ul>
          <li>
            <Ext href="https://fonts.google.com/specimen/Bricolage+Grotesque">Bricolage Grotesque</Ext>, SIL Open
            Font License 1.1, served from our own domain.
          </li>
          <li>
            <Ext href="https://phosphoricons.com">Phosphor Icons</Ext>, MIT License.
          </li>
        </ul>
      </section>

      <section>
        <h2>Source code</h2>
        <p>
          yourshelf is open source under the MIT License, built with Next.js, React, Express and MongoDB. The code is
          on <Ext href={SOURCE_URL}>GitHub</Ext>.
        </p>
      </section>
    </LegalPage>
  );
}
