<p align="center">
  <img src="web/public/logo.svg" alt="yourshelf" width="320" style="background:#50304d;padding:16px 24px;border-radius:16px" />
</p>

<p align="center">
  One shelf for everything you love: movies, games, books and albums. Friends can recommend what you should try.
</p>

---

## What it is

Every user has a **shelf** for the media they love. You add titles to your own shelf, and your **friends** can drop recommendations on it, with an optional note explaining why you should check them out. Friendships work like requests: someone asks, the other person accepts or denies, and only accepted friends can recommend.

The project has two parts:

| Part | Folder | Stack |
|---|---|---|
| REST API | root (`server.js`, `src/`) | Node.js, Express 5, Mongoose 9, MongoDB Atlas |
| Web app | `web/` | Next.js 16 (App Router), React 19, plain CSS |

The shelf holds **four media types**: movies, games, books and albums. Each one is backed by its own catalog API, and they all share the same shelf, recommendation and search flow.

Built to practice API design, authentication and data modeling with Express and MongoDB.

## Features

- Accounts with username, email and password built from scratch (sign in with username or email): scrypt password hashing, server-side sessions in HttpOnly cookies, login rate limiting
- Search for movies ([TMDB](https://www.themoviedb.org)), games ([IGDB](https://www.igdb.com)), books ([Open Library](https://openlibrary.org)) and albums ([Deezer](https://www.deezer.com)): pick a result to get its cover, synopsis and year, or type it yourself
- Items are shown as physical cases on a bookcase: Blu-ray cases with real disc art for movies ([fanart.tv](https://fanart.tv)), platform cases for games (PlayStation, Xbox, Switch), CDs for albums (disc art from fanart.tv or [MusicBrainz](https://musicbrainz.org) and the [Cover Art Archive](https://coverartarchive.org)) and books
- A details page for every title (`/movie/:id`, `/game/:id`, `/book/:id`, `/album/:id`) with facts, credits or tracklist and where to watch, based on the visitor's region
- **Trending**: the most added titles of each type across every shelf in the last 7 days, recomputed every week
- Personal shelf split into **my picks** and **recommended by friends**
- **Public or private** shelves: visitors browse public shelves, private ones are visible only to the owner and their friends
- Friend requests with a small state machine (`pending`, `accepted`, `denied`)
- Only accepted friends can recommend, only the owner can add or remove titles
- Consistent JSON errors with meaningful status codes (400, 401, 403, 404, 409)
- Landing page with a public shelf showcase built from static assets, so it does not call the API on every visit
- Web app with light and dark mode, responsive layout and reduced-motion support

## Architecture

```
web app (Next.js on Vercel)
   |  /api/* proxied to the API, session cookie sent along
   v
Express (Render)
   express.json()
   routes: auth | users | shelf | friendship | search | details | trending
   identifyUser / optionalUser (session cookie -> User document)
   errorHandler middleware (errors -> JSON)
   |
   |   \
   |    catalog clients: TMDB, IGDB, Open Library, Deezer, fanart.tv, MusicBrainz
   |    (responses cached in memory)
   v
Mongoose models  ->  MongoDB Atlas
   users          (each user embeds their shelf)
   relationships  (one document per requester)
   sessions       (hashed session tokens, TTL index)
   trendings      (one document per ISO week)
   albumdiscs     (album disc art lookups, kept for months)
```

### Data model

```js
User {
  name: String (required, unique, lowercase, 3 to 20 of a-z 0-9 _)
  email: String (required, unique, lowercase, never returned by the API)
  passwordHash: String (scrypt, never returned by the API)
  shelf: {
    visibility: "public" | "private"
    movies: [Item]   externalId is a TMDB id
    games:  [Item]   externalId is an IGDB id
    books:  [Item]   externalId is an Open Library work id (OL...W)
    albums: [Item]   externalId is a Deezer id
  }
}

Item {
  externalId, title (required), desc, posterPath, creator (author or artist),
  recommendedBy: ObjectId -> User,
  recommendationText
}

Session {
  tokenHash: String (SHA-256 of the cookie token, unique)
  user: ObjectId -> User
  expiresAt: Date (MongoDB TTL index deletes expired sessions)
}

Relationship {
  personId: ObjectId -> User (unique, the person who sent the requests)
  relationships: [{ friendId: ObjectId -> User, status: "pending" | "accepted" | "denied" }]
}

Trending {
  key: "2026-w48" (ISO week, unique)
  computedAt, windowStart, windowEnd
  top: { movie, game, book, album: [{ externalId, title, posterPath, creator, desc, count }] }
}

AlbumDisc {
  externalId (Deezer id, unique), discArt, crop, checkedAt
}
```

A title is a recommendation when it has `recommendedBy`. Titles picked from a catalog are shown with live data from that catalog (cached in memory for 24 hours), including extras that are never stored, like disc art and a game's platform. The stored title, synopsis and poster are a fallback when the catalog is unavailable. Trending counts each person once per title and ignores recommendations. A friendship is stored only on the requester's side, so the API checks both directions when it needs to know whether two people are friends.

## API

### Authentication

- **Passwords** are hashed with `scrypt` (Node `crypto`) and a random 16-byte salt per user, stored as `scrypt$salt$hash`, and compared with `timingSafeEqual`.
- **Sessions**: signing up or in creates a random 32-byte token. The browser gets it in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production); the database only stores its SHA-256 hash, so a database leak does not leak usable sessions. Sessions last 30 days and are removed automatically by a TTL index.
- **Login protection**: the same error for an unknown account and a wrong password, a dummy hash check for unknown users so timing does not reveal which accounts exist, and a lock after 10 failed attempts for 15 minutes.
- **Rate limiting** (`src/middlewares/rateLimiting.js`): per client IP, 5 signups per hour, 20 login attempts per 15 minutes and 60 details requests per minute; per signed-in user, 60 writes and 30 searches per minute and 5 account deletion attempts per 15 minutes. Counters live in memory and reset when the server restarts.
- No authentication library is used.

| Method | Route | Who can call |
|---|---|---|
| GET | `/health` | anyone |
| POST | `/auth/signup` | anyone (`{ name, email, password }`) |
| POST | `/auth/login` | anyone (`{ login, password }`, login is the username or email) |
| POST | `/auth/logout` | anyone |
| GET | `/users` | anyone (names, shelf visibility and, for public shelves, item counts and four covers) |
| GET | `/me` | signed-in user |
| PATCH | `/me/shelf` | signed-in user (set `visibility`) |
| DELETE | `/me` | signed-in user (`{ password }`; deletes the account, shelf, friendships, recommendations made to others and all sessions) |
| GET | `/shelf/:id` | anyone if public; owner and friends if private |
| POST | `/shelf/:id/:kind` | the shelf owner (`kind` is `movie`, `game`, `book` or `album`) |
| DELETE | `/shelf/:id/:kind/:itemId` | the shelf owner |
| POST | `/recommend/shelf/:id/:kind` | an accepted friend of the owner |
| POST | `/friendship/:id` | signed-in user |
| GET | `/friendship` | signed-in user (requests they received) |
| POST | `/update-relationship-state` | see the transitions below |
| GET | `/relationships` | signed-in user (their own relationships) |
| GET | `/movies/search?q=` (also `/games`, `/books`, `/albums`) | signed-in user |
| GET | `/movies/:externalId/details?region=` (also `/games`, `/books`, `/albums`) | anyone |
| GET | `/trending` | anyone (latest weekly list and when the next one comes out) |
| POST | `/trending/refresh` | anyone (recomputes the current week; called by the weekly GitHub Action) |

### Friendship transitions

| From | To | Who |
|---|---|---|
| no relation | `pending` | the requester, via `POST /friendship/:id` |
| `pending` | `accepted` or `denied` | only the person who received the request |
| `accepted` | `denied` | either friend (unfriend) |
| `denied` | `pending` | either person can send a new request |
| `denied` | `accepted` | not allowed |

## Running locally

Requirements: Node.js 22.9 or newer and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
npm install
cp .env.example .env
npm run dev
```

Fill `.env` with your connection string and the catalog keys. Every key is optional: without it the app still works, but that media type cannot be searched and has no details page.

| Variable | Used for | Where to get it |
|---|---|---|
| `MONGODB_URL` | database (required) | MongoDB Atlas |
| `TMDB_API_KEY` | movies | themoviedb.org, Settings, API (API Key or Read Access Token) |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | games (IGDB) | dev.twitch.tv console |
| `FANART_API_KEY` | movie and album disc art | fanart.tv |

Books (Open Library), albums (Deezer) and MusicBrainz need no key. The API runs on `http://localhost:3000`.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The web app runs on `http://localhost:3001`. Set `NEXT_PUBLIC_CONTACT_EMAIL` in `web/.env.local` to show a contact address on the privacy and terms pages.

### Scripts

| Command | What it does |
|---|---|
| `node --env-file=.env scripts/seed-demo.js` | creates demo users with full shelves and friendships |
| `node scripts/build-landing-people.js` | reads the public shelves from the API (`API_URL`, defaults to production), saves their covers to `web/public/landing/people` and writes `web/lib/landingPeople.js` for the landing page |

## Deploying

| Service | What | Settings |
|---|---|---|
| MongoDB Atlas | database | Network Access allows `0.0.0.0/0` (Render has no fixed IP) |
| Render | API | Web Service from this repo, build `npm install`, start `npm start`, env `MONGODB_URL`, `NODE_ENV=production` and the catalog keys above |
| Vercel | web app | Root Directory `web`, env `BACKEND_URL` (the Render URL) and `NEXT_PUBLIC_CONTACT_EMAIL` |
| GitHub Actions | weekly trending | `.github/workflows/trending.yml` wakes the API and calls `POST /trending/refresh` every Monday at 03:00 UTC (can also be run by hand) |

The free Render plan sleeps when idle, so the first request after a while can take up to a minute. The web app shows a notice while it wakes up.

## Project structure

```
server.js                    app setup, routers, error handler
src/config/db.js             MongoDB connection
src/models/                  User, Shelf (schema), Session, Relationship, Trending, AlbumDisc
src/lib/                     password hashing, sessions, catalog clients (tmdb, igdb, openlibrary,
                             deezer, fanart, albumart), catalogs registry, trending
src/middlewares/             identifyUser and optionalUser, errorHandler, rate limiting
src/routes/                  auth, users, shelf, friendship, search, details, trending
scripts/                     demo seed, landing page asset builder
web/app/                     pages: landing, shelf, friends, trending, movie/game/book/album details,
                             login, signup, privacy, terms, credits
web/components/              auth, header, landing, bookcase and cases, shelf view, details, search
web/lib/                     API client (cookies are sent automatically), media kinds, platforms, landing data
web/public/                  logo, landing covers, platform logos, textures
.github/workflows/           weekly trending refresh
```

## Roadmap

- Protect `POST /trending/refresh` with a secret so only the scheduled job can call it
- Automated tests for the API

## Credits

Movie data and posters are provided by [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB. Game data and covers from [IGDB](https://www.igdb.com), book data and covers from [Open Library](https://openlibrary.org), album data and covers from [Deezer](https://www.deezer.com), disc art from [fanart.tv](https://fanart.tv), [MusicBrainz](https://musicbrainz.org) and the [Cover Art Archive](https://coverartarchive.org). Platform logos are credited in [web/public/logos/CREDITS.md](web/public/logos/CREDITS.md).

## License

[MIT](LICENSE)
