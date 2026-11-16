// Static showcase for the landing page. Covers live in /public/landing so the page
// renders instantly without waking the API. Regenerate both together if you change them.

export const LANDING_WALL = [
  {
    "_id": "movie-spirited-away",
    "kind": "movie",
    "title": "Spirited Away",
    "cover": "/landing/movie-spirited-away.webp",
    "discArt": "/landing/movie-spirited-away-disc.webp"
  },
  {
    "_id": "game-hades",
    "kind": "game",
    "title": "Hades",
    "cover": "/landing/game-hades.webp",
    "platform": "PS5"
  },
  {
    "_id": "album-blonde",
    "kind": "album",
    "title": "Blonde",
    "cover": "/landing/album-blonde.webp"
  },
  {
    "_id": "movie-before-sunrise",
    "kind": "movie",
    "title": "Before Sunrise",
    "cover": "/landing/movie-before-sunrise.webp",
    "discArt": "/landing/movie-before-sunrise-disc.webp",
    "recommendedBy": {
      "name": "bia_meetcute"
    },
    "recommendationText": "Two people walking and talking for 100 minutes. You will love it."
  },
  {
    "_id": "game-animal-crossing-new-horizons",
    "kind": "game",
    "title": "Animal Crossing: New Horizons",
    "cover": "/landing/game-animal-crossing-new-horizons.webp",
    "platform": "Switch"
  },
  {
    "_id": "album-ok-computer",
    "kind": "album",
    "title": "OK Computer",
    "cover": "/landing/album-ok-computer.webp",
    "recommendedBy": {
      "name": "theo_rewinds"
    },
    "recommendationText": "Start with Paranoid Android. Thank me later."
  },
  {
    "_id": "movie-back-to-the-future",
    "kind": "movie",
    "title": "Back to the Future",
    "cover": "/landing/movie-back-to-the-future.webp",
    "discArt": "/landing/movie-back-to-the-future-disc.webp"
  },
  {
    "_id": "game-persona-5",
    "kind": "game",
    "title": "Persona 5",
    "cover": "/landing/game-persona-5.webp",
    "platform": "PS4"
  },
  {
    "_id": "album-random-access-memories",
    "kind": "album",
    "title": "Random Access Memories",
    "cover": "/landing/album-random-access-memories.webp"
  },
  {
    "_id": "movie-arrival",
    "kind": "movie",
    "title": "Arrival",
    "cover": "/landing/movie-arrival.webp",
    "discArt": "/landing/movie-arrival-disc.webp"
  },
  {
    "_id": "game-mass-effect-2",
    "kind": "game",
    "title": "Mass Effect 2",
    "cover": "/landing/game-mass-effect-2.webp",
    "platform": "PS3"
  },
  {
    "_id": "album-rumours",
    "kind": "album",
    "title": "Rumours",
    "cover": "/landing/album-rumours.webp"
  },
  {
    "_id": "movie-past-lives",
    "kind": "movie",
    "title": "Past Lives",
    "cover": "/landing/movie-past-lives.webp",
    "discArt": "/landing/movie-past-lives-disc.webp"
  },
  {
    "_id": "game-outer-wilds",
    "kind": "game",
    "title": "Outer Wilds",
    "cover": "/landing/game-outer-wilds.webp",
    "platform": "PS5"
  },
  {
    "_id": "album-in-rainbows",
    "kind": "album",
    "title": "In Rainbows",
    "cover": "/landing/album-in-rainbows.webp"
  },
  {
    "_id": "movie-hereditary",
    "kind": "movie",
    "title": "Hereditary",
    "cover": "/landing/movie-hereditary.webp",
    "discArt": "/landing/movie-hereditary-disc.webp"
  },
  {
    "_id": "game-portal-2",
    "kind": "game",
    "title": "Portal 2",
    "cover": "/landing/game-portal-2.webp",
    "platform": "Switch"
  },
  {
    "_id": "album-melodrama",
    "kind": "album",
    "title": "Melodrama",
    "cover": "/landing/album-melodrama.webp"
  },
  {
    "_id": "movie-akira",
    "kind": "movie",
    "title": "Akira",
    "cover": "/landing/movie-akira.webp",
    "discArt": "/landing/movie-akira-disc.webp"
  }
];

export const LANDING_STORY = {
  "_id": "movie-lady-bird",
  "kind": "movie",
  "title": "Lady Bird",
  "cover": "/landing/movie-lady-bird.webp",
  "discArt": "/landing/movie-lady-bird-disc.webp",
  "recommendedBy": {
    "name": "marina_cine"
  },
  "recommendationText": "You will want to call your mom right after.",
  "owner": {
    "name": "bia_meetcute"
  },
  "neighbors": [
    {
      "_id": "movie-when-harry-met-sally",
      "kind": "movie",
      "title": "When Harry Met Sally...",
      "cover": "/landing/movie-when-harry-met-sally.webp",
      "discArt": "/landing/movie-when-harry-met-sally-disc.webp"
    },
    {
      "_id": "movie-notting-hill",
      "kind": "movie",
      "title": "Notting Hill",
      "cover": "/landing/movie-notting-hill.webp",
      "discArt": "/landing/movie-notting-hill-disc.webp"
    }
  ]
};
