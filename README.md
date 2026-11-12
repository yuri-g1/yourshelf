<p align="center">
  <img src="web/public/logo.svg" alt="yourshelf" width="320" style="background:#50304d;padding:16px 24px;border-radius:16px" />
</p>

<p align="center">
  One shelf for everything you love: movies today, games and albums next. Friends can recommend what you should try.
</p>

---

## What it is

Every user has a **shelf** for the media they love. You add titles to your own shelf, and your **friends** can drop recommendations on it, with an optional note explaining why you should check them out. Friendships work like requests: someone asks, the other person accepts or denies, and only accepted friends can recommend.

The project has two parts:

| Part | Folder | Stack |
|---|---|---|
| REST API | root (`server.js`, `src/`) | Node.js, Express 5, Mongoose 9, MongoDB Atlas |
| Web app | `web/` | Next.js 16 (App Router), React 19, plain CSS |

**Movies are the first media type.** The goal is one shelf that also holds games, albums and other media, so the data model and UI are planned to grow beyond movies.

Built to practice API design, authentication and data modeling with Express and MongoDB.

## Features

- Accounts with username, email and password built from scratch (sign in with username or email): scrypt password hashing, server-side sessions in HttpOnly cookies, login rate limiting
- Movie search powered by [TMDB](https://www.themoviedb.org): pick a movie to get its poster, synopsis and year, or type it yourself
- Personal shelf split into **my picks** and **recommended by friends**
- **Public or private** shelves: visitors browse public shelves, private ones are visible only to the owner and their friends
- Friend requests with a small state machine (`pending`, `accepted`, `denied`)
- Only accepted friends can recommend, only the owner can add or remove titles
- Consistent JSON errors with meaningful status codes (400, 401, 403, 404, 409)
- Web app with light and dark mode, responsive layout and reduced-motion support

## Architecture

```
web app (Next.js on Vercel)
   |  /api/* proxied to the API, session cookie sent along
   v
Express (Render)
   express.json()
   routes: auth | users | shelf | friendship
   identifyUser / optionalUser (session cookie -> User document)
   errorHandler middleware (errors -> JSON)
   |
   v
Mongoose models  ->  MongoDB Atlas
   users          (each user embeds their shelf)
   relationships  (one document per requester)
```

### Data model

```js
User {
  name: String (required, unique, lowercase, 3 to 20 of a-z 0-9 _)
  email: String (required, unique, lowercase, never returned by the API)
  passwordHash: String (scrypt, never returned by the API)
  shelf: {
    visibility: "public" | "private"
    movies: [{
      externalId (TMDB id), title (required), desc, posterPath,
      recommendedBy: ObjectId -> User,
      recommendationText
    }]
  }
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
```

A title is a recommendation when it has `recommendedBy`. Movies picked from TMDB are shown with live data from TMDB (cached for 24 hours); the stored title, synopsis and poster are a fallback when TMDB is unavailable. A friendship is stored only on the requester's side, so the API checks both directions when it needs to know whether two people are friends.

## API

### Authentication

- **Passwords** are hashed with `scrypt` (Node `crypto`) and a random 16-byte salt per user, stored as `scrypt$salt$hash`, and compared with `timingSafeEqual`.
- **Sessions**: signing up or in creates a random 32-byte token. The browser gets it in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production); the database only stores its SHA-256 hash, so a database leak does not leak usable sessions. Sessions last 30 days and are removed automatically by a TTL index.
- **Login protection**: the same error for an unknown account and a wrong password, a dummy hash check for unknown users so timing does not reveal which accounts exist, and a lock after 10 failed attempts for 15 minutes.
- **Rate limiting** (`src/middlewares/rateLimiting.js`): 5 signups per hour and 20 login attempts per 15 minutes per client IP, and 60 write requests per minute per signed-in user. Counters live in memory and reset when the server restarts.
- No authentication library is used.

| Method | Route | Who can call |
|---|---|---|
| GET | `/health` | anyone |
| POST | `/auth/signup` | anyone (`{ name, email, password }`) |
| POST | `/auth/login` | anyone (`{ login, password }`, login is the username or email) |
| POST | `/auth/logout` | anyone |
| GET | `/users` | anyone (names and shelf visibility) |
| GET | `/me` | signed-in user |
| PATCH | `/me/shelf` | signed-in user (set `visibility`) |
| DELETE | `/me` | signed-in user (`{ password }`; deletes the account, shelf, friendships, recommendations made to others and all sessions) |
| GET | `/shelf/:id` | anyone if public; owner and friends if private |
| POST | `/shelf/:id/movie` | the shelf owner |
| DELETE | `/shelf/:id/movie/:movieId` | the shelf owner |
| POST | `/recommend/shelf/:id/movie` | an accepted friend of the owner |
| POST | `/friendship/:id` | signed-in user |
| GET | `/friendship` | signed-in user (requests they received) |
| POST | `/update-relationship-state` | see the transitions below |
| GET | `/relationships` | signed-in user (their own relationships) |
| GET | `/movies/search?q=` | signed-in user (TMDB search, 30 per minute) |

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

Fill `.env` with your connection string and your TMDB **API Key** or **API Read Access Token** (themoviedb.org, Settings, API) as `TMDB_API_KEY`. Without the token the app still works, but movie search is disabled. The API runs on `http://localhost:3000`.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The web app runs on `http://localhost:3001`.

## Deploying

| Service | What | Settings |
|---|---|---|
| MongoDB Atlas | database | Network Access allows `0.0.0.0/0` (Render has no fixed IP) |
| Render | API | Web Service from this repo, build `npm install`, start `npm start`, env `MONGODB_URL`, `NODE_ENV=production`, `TMDB_API_KEY` |
| Vercel | web app | Root Directory `web`, env `BACKEND_URL` (the Render URL) |

The free Render plan sleeps when idle, so the first request after a while can take up to a minute. The web app shows a notice while it wakes up.

## Project structure

```
server.js                    app setup, routers, error handler
src/config/db.js             MongoDB connection
src/models/                  User, Shelf (schema), Session, Relationship
src/lib/                     password hashing, sessions, TMDB client
src/middlewares/             identifyUser and optionalUser, errorHandler
src/routes/                  auth, users, shelf, friendship, movies
web/app/                     pages: shelves, my shelf, a friend's shelf, friends, login, signup
web/components/              auth provider and form, header, shelf view, public shelves, movie card
web/lib/api.js               API client (cookies are sent automatically)
```

## Roadmap

- More media types on the same shelf: games, albums and beyond
- Catalog APIs for games and music, like TMDB for movies
- Automated tests for the API

## Credits

Movie data and posters are provided by [TMDB](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

[MIT](LICENSE)
