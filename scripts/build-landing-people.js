const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const API_URL = process.env.API_URL || "https://yourshelf.onrender.com";
const SHOWN = 8;
const SIZE = 342;
const WEB = path.join(__dirname, "..", "web");
const DIR = path.join(WEB, "public", "landing", "people");
const OUT = path.join(WEB, "lib", "landingPeople.js");

const IMAGE = {
  movie: (p) => `https://image.tmdb.org/t/p/w342${p}`,
  game: (p) => `https://images.igdb.com/igdb/image/upload/t_cover_big/${p}.jpg`,
  album: (p) => `https://cdn-images.dzcdn.net/images/cover/${p}/500x500-000000-80-0-0.jpg`,
};

const totalOf = (preview) => Object.values(preview?.counts || {}).reduce((sum, count) => sum + count, 0);

const slug = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function save(item, file) {
  const response = await fetch(IMAGE[item.kind](item.posterPath));
  if (!response.ok) throw new Error(`${response.status} for ${item.title}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer).resize({ width: SIZE }).webp({ quality: 80 }).toFile(path.join(DIR, file));
}

async function main() {
  const response = await fetch(`${API_URL}/users`);
  if (!response.ok) throw new Error(`users: ${response.status}`);
  const list = await response.json();

  const people = list
    .filter((user) => user.visibility === "public" && totalOf(user.preview) > 0)
    .sort((a, b) => totalOf(b.preview) - totalOf(a.preview))
    .slice(0, SHOWN);

  await fs.rm(DIR, { recursive: true, force: true });
  await fs.mkdir(DIR, { recursive: true });

  const result = [];
  for (const user of people) {
    const posters = [];
    for (const item of user.preview.posters) {
      if (!IMAGE[item.kind] || !item.posterPath) continue;
      const file = `${slug(user.name)}-${item.kind}-${slug(item.title)}.webp`;
      await save(item, file);
      posters.push({ kind: item.kind, title: item.title, src: `/landing/people/${file}` });
    }
    result.push({
      _id: user._id,
      name: user.name,
      preview: { counts: user.preview.counts, posters },
    });
  }

  await fs.writeFile(OUT, `export const LANDING_PEOPLE = ${JSON.stringify(result, null, 2)};\n`);
  console.log(`${result.length} people, ${result.reduce((n, p) => n + p.preview.posters.length, 0)} posters`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
