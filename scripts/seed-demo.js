const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Relationship = require("../src/models/Relationship");
const { hashPassword } = require("../src/lib/password");
const tmdb = require("../src/lib/tmdb");
const igdb = require("../src/lib/igdb");

const PEOPLE = [
  {
    name: "marina_cine",
    picks: [
      ["Lady Bird", "2017"],
      ["Moonlight", "2016"],
      ["Aftersun", "2022"],
      ["Past Lives", "2023"],
      ["The Lighthouse", "2019"],
      ["Frances Ha", "2012"],
    ],
  },
  {
    name: "theo_rewinds",
    picks: [
      ["Back to the Future", "1985"],
      ["The Breakfast Club", "1985"],
      ["Jurassic Park", "1993"],
      ["Terminator 2: Judgment Day", "1991"],
      ["Ghostbusters", "1984"],
      ["Die Hard", "1988"],
      ["Stand by Me", "1986"],
      ["The Princess Bride", "1987"],
      ["Raiders of the Lost Ark", "1981"],
    ],
  },
  {
    name: "kenji_frames",
    picks: [
      ["Spirited Away", "2001"],
      ["Your Name.", "2016"],
      ["Akira", "1988"],
      ["Princess Mononoke", "1997"],
      ["My Neighbor Totoro", "1988"],
      ["Paprika", "2006"],
      ["Ghost in the Shell", "1995"],
      ["Perfect Blue", "1997"],
      ["Howl's Moving Castle", "2004"],
      ["A Silent Voice", "2016"],
      ["Grave of the Fireflies", "1988"],
      ["Wolf Children", "2012"],
      ["Weathering with You", "2019"],
      ["Nausicaä of the Valley of the Wind", "1984"],
    ],
  },
  {
    name: "lu_after_dark",
    picks: [
      ["Hereditary", "2018"],
      ["The Shining", "1980"],
      ["It Follows", "2014"],
      ["The Babadook", "2014"],
      ["Midsommar", "2019"],
      ["Alien", "1979"],
      ["The Witch", "2016"],
    ],
  },
  {
    name: "bia_meetcute",
    picks: [
      ["When Harry Met Sally...", "1989"],
      ["Notting Hill", "1999"],
      ["Pride & Prejudice", "2005"],
      ["About Time", "2013"],
      ["10 Things I Hate About You", "1999"],
    ],
  },
  {
    name: "rafa_noir",
    visibility: "private",
    picks: [
      ["Chinatown", "1974"],
      ["Blade Runner", "1982"],
      ["Zodiac", "2007"],
      ["Se7en", "1995"],
      ["Heat", "1995"],
      ["Drive", "2011"],
      ["Prisoners", "2013"],
      ["The Third Man", "1949"],
    ],
  },
  {
    name: "dani_docs",
    picks: [
      ["Free Solo", "2018"],
      ["Won't You Be My Neighbor?", "2018"],
      ["Man on Wire", "2008"],
    ],
  },
];

const FRIENDS = [
  ["marina_cine", "theo_rewinds", "accepted"],
  ["bia_meetcute", "marina_cine", "accepted"],
  ["marina_cine", "kenji_frames", "accepted"],
  ["kenji_frames", "lu_after_dark", "accepted"],
  ["theo_rewinds", "kenji_frames", "accepted"],
  ["lu_after_dark", "rafa_noir", "accepted"],
  ["dani_docs", "bia_meetcute", "accepted"],
  ["dani_docs", "lu_after_dark", "pending"],
];

const RECOMMENDATIONS = [
  ["theo_rewinds", "marina_cine", ["Groundhog Day", "1993"], "Bill Murray at his driest. The ending gets me every time."],
  ["bia_meetcute", "marina_cine", ["Before Sunrise", "1995"], "Two people walking and talking for 100 minutes. You will love it."],
  ["marina_cine", "theo_rewinds", ["Everything Everywhere All at Once", "2022"], "Multiverse chaos with a huge soft heart."],
  ["kenji_frames", "theo_rewinds", ["The Iron Giant", "1999"], "You love the 80s vibe, this one nails it."],
  ["marina_cine", "kenji_frames", ["Portrait of a Lady on Fire", "2019"], "Every frame looks like a painting. Right up your alley."],
  ["lu_after_dark", "kenji_frames", ["The Thing", "1982"], "Practical effects heaven. Watch it with the lights off."],
  ["theo_rewinds", "kenji_frames", ["E.T. the Extra-Terrestrial", "1982"], null],
  ["kenji_frames", "lu_after_dark", ["Cure", "1997"], "Slow, quiet and deeply unsettling. Kurosawa at his best."],
  ["rafa_noir", "lu_after_dark", ["The Silence of the Lambs", "1991"], "Not pure horror, but Hopkins is scarier than most monsters."],
  ["marina_cine", "bia_meetcute", ["Lady Bird", "2017"], "You will want to call your mom right after."],
  ["dani_docs", "bia_meetcute", ["Jiro Dreams of Sushi", "2011"], "Make a reservation somewhere before you watch this."],
  ["lu_after_dark", "rafa_noir", ["Get Out", "2017"], "Sharp as a thriller first, horror second."],
];

const GAMES = {
  marina_cine: [
    ["Gris", "2018"],
    ["Journey", "2012"],
    ["What Remains of Edith Finch", "2017"],
    ["Outer Wilds", "2019"],
  ],
  theo_rewinds: [
    ["Super Mario Bros. 3", "1988"],
    ["The Legend of Zelda: A Link to the Past", "1991"],
    ["Chrono Trigger", "1995"],
    ["Doom", "1993"],
    ["Street Fighter II: The World Warrior", "1991"],
  ],
  kenji_frames: [
    ["Persona 5", "2016"],
    ["Final Fantasy VII", "1997"],
    ["Okami", "2006"],
    ["Sekiro: Shadows Die Twice", "2019"],
    ["Ni no Kuni: Wrath of the White Witch", "2011"],
  ],
  lu_after_dark: [
    ["Silent Hill 2", "2001"],
    ["Resident Evil 4", "2005"],
    ["Dead Space", "2008"],
    ["Amnesia: The Dark Descent", "2010"],
    ["Inside", "2016"],
  ],
  bia_meetcute: [
    ["Stardew Valley", "2016"],
    ["Animal Crossing: New Horizons", "2020"],
    ["Unpacking", "2021"],
  ],
  rafa_noir: [
    ["L.A. Noire", "2011"],
    ["Disco Elysium", "2019"],
    ["Max Payne", "2001"],
  ],
};

const GAME_RECOMMENDATIONS = [
  ["kenji_frames", "marina_cine", ["Spiritfarer", "2020"], "Cozy and sad in the best way. Bring tissues."],
  ["theo_rewinds", "marina_cine", ["Celeste", "2018"], "Pixel art platformer with a huge heart."],
  ["theo_rewinds", "kenji_frames", ["Chrono Cross", "1999"], "If you liked Chrono Trigger art, this soundtrack will get you."],
  ["kenji_frames", "theo_rewinds", ["Hollow Knight", "2017"], "Hard like the NES days, but always fair."],
  ["kenji_frames", "lu_after_dark", ["A Short Hike", "2019"], "You need a break from all the horror. Trust me."],
  ["rafa_noir", "lu_after_dark", ["Return of the Obra Dinn", "2018"], "A murder mystery you solve with a pocket watch."],
  ["marina_cine", "bia_meetcute", ["Florence", "2018"], "Twenty minutes, one love story, almost no words."],
  ["lu_after_dark", "rafa_noir", ["Heavy Rain", "2010"], null],
];

function plain(text) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

async function findGame([title, year]) {
  const results = await igdb.searchGames(title);
  const sameTitle = (game) => plain(game.title) === plain(title);
  const match =
    results.find((game) => sameTitle(game) && game.year === year) ||
    results.find(sameTitle) ||
    results.find((game) => game.year === year) ||
    results[0];

  if (!match) throw new Error(`No IGDB result for ${title}`);

  return {
    externalId: match.externalId,
    title: match.title,
    desc: match.desc,
    posterPath: match.posterPath || undefined,
  };
}

async function findMovie([title, year]) {
  const results = await tmdb.searchMovies(title);
  const sameTitle = (movie) => movie.title.toLowerCase() === title.toLowerCase();
  const match =
    results.find((movie) => sameTitle(movie) && movie.year === year) ||
    results.find((movie) => movie.year === year) ||
    results[0];

  if (!match) throw new Error(`No TMDB result for ${title}`);

  return {
    externalId: match.externalId,
    title: match.title,
    desc: match.desc,
    posterPath: match.posterPath || undefined,
  };
}

async function createPeople() {
  const users = {};

  for (const person of PEOPLE) {
    const movies = [];
    for (const pick of person.picks) movies.push(await findMovie(pick));

    users[person.name] = await User.create({
      name: person.name,
      email: `${person.name}@example.com`,
      passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
      shelf: { visibility: person.visibility || "public", movies },
    });

    console.log(`Created ${person.name} with ${movies.length} movies`);
  }

  for (const [from, to, status] of FRIENDS) {
    await Relationship.updateOne(
      { personId: users[from]._id },
      { $push: { relationships: { friendId: users[to]._id, status } } },
      { upsert: true },
    );
  }

  console.log(`Created ${FRIENDS.length} friendships`);

  for (const [from, to, pick, note] of RECOMMENDATIONS) {
    users[to].shelf.movies.push({
      ...(await findMovie(pick)),
      recommendedBy: users[from]._id,
      recommendationText: note || undefined,
    });
    await users[to].save();
  }

  console.log(`Created ${RECOMMENDATIONS.length} movie recommendations`);

  return users;
}

async function addGames(users) {
  const fresh = Object.keys(GAMES).filter((name) => users[name] && users[name].shelf.games.length === 0);

  if (fresh.length === 0) {
    console.log("Demo games already exist. Nothing to do.");
    return;
  }

  for (const name of fresh) {
    for (const pick of GAMES[name]) users[name].shelf.games.push(await findGame(pick));
    console.log(`Added ${GAMES[name].length} games to ${name}`);
  }

  const recommendations = GAME_RECOMMENDATIONS.filter(([, to]) => fresh.includes(to));

  for (const [from, to, pick, note] of recommendations) {
    users[to].shelf.games.push({
      ...(await findGame(pick)),
      recommendedBy: users[from]._id,
      recommendationText: note || undefined,
    });
  }

  for (const name of fresh) await users[name].save();

  console.log(`Created ${recommendations.length} game recommendations`);
}

async function main() {
  if (!tmdb.isConfigured()) throw new Error("TMDB_API_KEY is not set");
  if (!igdb.isConfigured()) throw new Error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not set");

  await mongoose.connect(process.env.MONGODB_URL);

  const names = PEOPLE.map((person) => person.name);
  const existing = await User.find({ name: { $in: names } });
  let users;

  if (existing.length === 0) {
    users = await createPeople();
  } else {
    users = Object.fromEntries(existing.map((user) => [user.name, user]));
    console.log(`Demo users already exist (${existing.length}). Skipping movies.`);
  }

  await addGames(users);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
