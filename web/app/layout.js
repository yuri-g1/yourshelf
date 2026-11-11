import { Geist } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";

const geist = Geist({
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
    <html lang="en" className={geist.variable}>
      <body>
        <AuthProvider>
          <Header />
          <main>
            <div className="container">{children}</div>
          </main>
          <footer className="footer">
            <div className="container">
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
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
