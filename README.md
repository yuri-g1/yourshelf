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

> **Demo mode.** The web app currently runs on sample data (lorem ipsum names and titles) stored in your browser, so it works without the API. Connecting it to the real API is on the roadmap.

**Movies are the first media type.** The goal is one shelf that also holds games, albums and other media, so the data model and UI are planned to grow beyond movies.

I built this while learning Express and MongoDB, moving on from a previous project written with Node's plain `http` module and a JSON file.

## Features

- Personal shelf split into **my picks** and **recommended by friends**
- Friend requests with a small state machine (`pending`, `accepted`, `denied`)
- Only accepted friends can recommend, only the owner can add or remove titles
- Consistent JSON errors with meaningful status codes (400, 401, 403, 404, 409)
- Web app with light and dark mode, responsive layout and reduced-motion support

## Architecture

```
client (web app / Postman)
   |  HTTP + X-User-Id header
   v
Express
   express.json()
   routes: users | shelf | friendship
   identifyUser middleware (protected routes)
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
  name: String (required, unique)
  shelf: {
    movies: [{
      externalId, title (required), desc,
      recommendedBy: ObjectId -> User,
      recommendationText
    }]
  }
}

Relationship {
  personId: ObjectId -> User (unique, the person who sent the requests)
  relationships: [{ friendId: ObjectId -> User, status: "pending" | "accepted" | "denied" }]
}
```

A title is a recommendation when it has `recommendedBy`. A friendship is stored only on the requester's side, so the API checks both directions when it needs to know whether two people are friends.

## API

Identity is sent in the `X-User-Id` header (the `_id` returned by `/signup`). There is no authentication yet, see the roadmap.

| Method | Route | Who can call |
|---|---|---|
| POST | `/signup` | anyone |
| GET | `/users` | anyone |
| GET | `/shelf/:id` | anyone |
| POST | `/shelf/:id/movie` | the shelf owner |
| DELETE | `/shelf/:id/movie/:movieId` | the shelf owner |
| POST | `/recommend/shelf/:id/movie` | an accepted friend of the owner |
| POST | `/friendship/:id` | any identified user |
| GET | `/friendship` | identified user (requests they received) |
| POST | `/update-relationship-state` | see the transitions below |
| GET | `/relationships` | identified user (their own relationships) |

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

Fill `.env` with your connection string. The API runs on `http://localhost:3000`.

```bash
cd web
npm install
npm run dev
```

The web app runs on `http://localhost:3001`.

## Project structure

```
server.js                    app setup, routers, error handler
src/config/db.js             MongoDB connection
src/models/                  User, Shelf (schema), Relationship
src/middlewares/             identifyUser, errorHandler
src/routes/                  users, shelf, friendship
web/app/                     pages: my shelf, a friend's shelf, friends
web/components/              header, demo bar, shelf view, movie card, forms
web/lib/demo.js              demo data and rules (browser only)
web/lib/api.js               API client for when demo mode is turned off
```

## Roadmap

- Real authentication instead of the `X-User-Id` header
- More media types on the same shelf: games, albums and beyond
- Real titles and cover art from public catalog APIs (movies, games, music)
- Deploy the API and connect the web app to it
- Automated tests for the API

## License

[MIT](LICENSE)
