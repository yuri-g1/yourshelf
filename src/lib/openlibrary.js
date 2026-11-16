const { createCache, formatDate, formatCount, joinNames, fact, compact } = require("./details");

const BASE_URL = "https://openlibrary.org";
const USER_AGENT = "yourshelf/1.0";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const BATCH_SIZE = 50;
const SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i";
const WORK_ID = /^OL\d+W$/;

const DETAIL_FIELDS =
  "key,title,author_name,author_key,first_publish_year,cover_i,number_of_pages_median,ratings_average,ratings_count,edition_count,subject";
const COVERS_URL = "https://covers.openlibrary.org";
const AUTHOR_LIMIT = 4;
const SUBJECT_NOISE = /[:,()/]|new york times|bestseller|reviewed|accessible|protected|in library|large type|^open library|^long now|^reading level/i;

const bookCache = new Map();
const detailsCache = createCache(CACHE_TTL_MS);

class OpenLibraryError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "OpenLibraryError";
    this.status = status;
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

  if (!response.ok) throw new OpenLibraryError(`Open Library responded ${response.status}`, response.status);

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

function coverUrl(id, size) {
  return id ? `${COVERS_URL}/b/id/${id}-${size}.jpg` : null;
}

function textOf(value) {
  return String((typeof value === "string" ? value : value?.value) || "").trim();
}

function cleanSubjects(subjects) {
  const seen = new Set();

  const clean = (subjects || [])
    .filter((subject) => typeof subject === "string" && subject.length <= 32 && !SUBJECT_NOISE.test(subject))
    .map((subject) => `${subject[0].toUpperCase()}${subject.slice(1).toLowerCase()}`)
    .filter((subject) => {
      const key = subject.toLowerCase().replace(/[^a-z]/g, "");
      return key && !seen.has(key) && seen.add(key);
    });
  const specific = clean.filter((subject) => subject !== "Fiction");

  return (specific.length > 0 ? specific : clean).slice(0, 6);
}

async function authorFor(key, name) {
  try {
    const author = await request(`/authors/${key}.json`);
    const photo = (author.photos || []).find((id) => id > 0);
    return { name: author.name || name, role: null, image: photo ? `${COVERS_URL}/a/id/${photo}-M.jpg` : null };
  } catch {
    return { name, role: null, image: null };
  }
}

async function moreByAuthor(authorKey, externalId) {
  if (!authorKey) return [];

  try {
    const data = await request("/search.json", {
      q: `author_key:${authorKey}`,
      fields: "key,title,first_publish_year,cover_i",
      sort: "readinglog",
      limit: "13",
    });

    return (data.docs || [])
      .map((doc) => ({ ...doc, id: String(doc.key || "").replace("/works/", "") }))
      .filter((doc) => WORK_ID.test(doc.id) && doc.id !== externalId)
      .slice(0, 12)
      .map((doc) => ({
        externalId: doc.id,
        title: doc.title,
        year: doc.first_publish_year ? String(doc.first_publish_year) : null,
        image: coverUrl(doc.cover_i, "L"),
      }));
  } catch (error) {
    console.error("Open Library author works failed:", error.message);
    return [];
  }
}

async function getBookDetails(externalId) {
  if (!WORK_ID.test(externalId)) return null;

  const cached = detailsCache.get(externalId);
  if (cached) return cached;

  const [work, search] = await Promise.all([
    request(`/works/${externalId}.json`),
    request("/search.json", { q: `key:/works/${externalId}`, fields: DETAIL_FIELDS, limit: "1" }),
  ]);
  const doc = search.docs?.[0] || {};
  const keys = (doc.author_key || []).slice(0, AUTHOR_LIMIT);
  const [authors, similar] = await Promise.all([
    Promise.all(keys.map((key, index) => authorFor(key, doc.author_name?.[index] || "Unknown author"))),
    moreByAuthor(keys[0], externalId),
  ]);
  const covers = (work.covers || []).filter((id) => id > 0);
  const mainCover = doc.cover_i || covers[0];
  const subjects = cleanSubjects(doc.subject?.length ? doc.subject : work.subjects);
  const year = doc.first_publish_year ? String(doc.first_publish_year) : null;
  const pages = doc.number_of_pages_median ? `${doc.number_of_pages_median} pages` : null;

  return detailsCache.set(externalId, {
    kind: "book",
    externalId,
    title: String(work.title || doc.title || ""),
    year,
    creator: joinNames(doc.author_name || [], 2),
    tagline: textOf(work.subtitle) || null,
    desc: textOf(work.description),
    story: null,
    poster: coverUrl(mainCover, "L"),
    backdrop: null,
    rating:
      doc.ratings_count > 0
        ? { value: Number(doc.ratings_average.toFixed(1)), scale: 5, count: doc.ratings_count }
        : null,
    highlights: compact([pages, subjects[0]]),
    genres: subjects,
    facts: compact([
      fact("First published", formatDate(work.first_publish_date) || year),
      fact("Pages", doc.number_of_pages_median),
      fact("Editions", formatCount(doc.edition_count)),
      fact("Author", joinNames(doc.author_name || [])),
    ]),
    people: { label: authors.length === 1 ? "Author" : "Authors", list: authors },
    tracks: [],
    videos: [],
    gallery: {
      label: "Covers",
      list: covers
        .filter((id) => id !== mainCover)
        .slice(0, 12)
        .map((id) => ({ thumb: coverUrl(id, "M"), full: coverUrl(id, "L") })),
    },
    similar: { label: doc.author_name?.[0] ? `More by ${doc.author_name[0]}` : "More books", list: similar },
    links: [{ label: "Open Library", url: `${BASE_URL}/works/${externalId}` }],
    watch: null,
  });
}

module.exports = { isConfigured, searchBooks, getBooks, describeBook, getBookDetails, OpenLibraryError };
