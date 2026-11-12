import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import Link from "next/link";
import { SOURCE_URL } from "@/lib/legal";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "yourshelf",
  description: "One shelf for the movies, games and albums you love, with recommendations from friends.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>
        <AuthProvider>
          <Header />
          <main>
            <div className="container">{children}</div>
          </main>
          <footer className="footer">
            <div className="container">
              <nav className="footer-links" aria-label="Legal">
                <span>© {new Date().getFullYear()} yourshelf</span>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/credits">Credits</Link>
                <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
                  Source
                </a>
              </nav>
              <p className="footer-note">
                Movie data and posters from{" "}
                <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
                  TMDB
                </a>
                . This product uses the TMDB API but is not endorsed or certified by TMDB. Game data and covers from{" "}
                <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer">
                  IGDB
                </a>
                . Book data and covers from{" "}
                <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">
                  Open Library
                </a>
                . Album data and covers from{" "}
                <a href="https://www.deezer.com" target="_blank" rel="noopener noreferrer">
                  Deezer
                </a>
                .
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
