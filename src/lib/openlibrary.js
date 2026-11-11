const BASE_URL = "https://openlibrary.org";
const USER_AGENT = "yourshelf/1.0";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const BATCH_SIZE = 50;
const SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i";
const WORK_ID = /^OL\d+W$/;

const bookCache = new Map();

class OpenLibraryError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpenLibraryError";
  }
}

function isConfigured() {
  return true;
}

async function request(path, params = {}) {
  const url = new URL(BASE_URL + path);

  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new OpenLibraryError(`Open Library responded ${response.status}`);

  return response.json();
}

function toBook(raw) {
  return {
    externalId: String(raw.key || "").replace("/works/", ""),
    title: String(raw.title || "").slice(0, 100),
    desc: "",
    posterPath: raw.cover_i ? String(raw.cover_i) : null,
    year: raw.first_publish_year ? String(raw.first_publish_year) : null,
    creator: raw.author_name?.[0]?.slice(0, 100) || null,
  };
}

function remember(book) {
  if (bookCache.size >= MAX_CACHE_ENTRIES) {
    bookCache.delete(bookCache.keys().next().value);
  }

  bookCache.set(book.externalId, { book, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function searchBooks(query) {
  const term = query.replace(/[-+!():^"~*?[\]{}\\/&|]/g, " ").replace(/\s+/g, " ").trim();

  if (!term) return [];

  const data = await request("/search.json", { q: term, fields: SEARCH_FIELDS, limit: "10" });

  return (data.docs || []).map(toBook).filter((book) => WORK_ID.test(book.externalId));
}

async function getBooks(externalIds) {
  const result = new Map();
  const missing = [];

  for (const id of new Set(externalIds)) {
    if (!WORK_ID.test(id)) continue;

    const cached = bookCache.get(id);
    if (cached && Date.now() < cached.expiresAt) result.set(id, cached.book);
    else missing.push(id);
  }

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const keys = missing.slice(i, i + BATCH_SIZE).map((id) => `/works/${id}`);
    const data = await request("/search.json", {
      q: `key:(${keys.join(" OR ")})`,
      fields: SEARCH_FIELDS,
      limit: String(keys.length),
    });

    for (const book of (data.docs || []).map(toBook)) {
      remember(book);
      result.set(book.externalId, book);
    }
  }

  return result;
}

async function describeBook(externalId) {
  if (!WORK_ID.test(externalId)) return "";

  const work = await request(`/works/${externalId}.json`);
  const description = typeof work.description === "string" ? work.description : work.description?.value;

  return String(description || "").slice(0, 500);
}

module.exports = { isConfigured, searchBooks, getBooks, describeBook, OpenLibraryError };
