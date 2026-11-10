const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Relationship = require("../src/models/Relationship");
const { hashPassword } = require("../src/lib/password");
const tmdb = require("../src/lib/tmdb");

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

async function main() {
  if (!tmdb.isConfigured()) throw new Error("TMDB_API_KEY is not set");

  await mongoose.connect(process.env.MONGODB_URL);

  const names = PEOPLE.map((person) => person.name);
  const existing = await User.find({ name: { $in: names } }).select("name");

  if (existing.length > 0) {
    console.log(`Demo users already exist (${existing.map((user) => user.name).join(", ")}). Nothing to do.`);
    return;
  }

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
    const movie = await findMovie(pick);
    const owner = users[to];

    owner.shelf.movies.push({
      ...movie,
      recommendedBy: users[from]._id,
      recommendationText: note || undefined,
    });
    await owner.save();
  }

  console.log(`Created ${RECOMMENDATIONS.length} recommendations`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
