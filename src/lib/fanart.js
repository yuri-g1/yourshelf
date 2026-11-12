// fanart.tv: real disc artwork and title logos (transparent PNGs) for
// movies, looked up by TMDB id. Used only to decorate cases on the shelf,
// so every failure resolves to empty art instead of throwing.
const BASE_URL = "https://webservice.fanart.tv/v3";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const DISC_TYPE_ORDER = ["bluray", "dvd", "3d"];

const discCache = new Map();

function isConfigured() {
  return Boolean(process.env.FANART_API_KEY);
}

const NO_ART = { discArt: null, titleLogo: null };

function rank(disc) {
  const type = DISC_TYPE_ORDER.indexOf(disc.disc_type);
  const lang = disc.lang === "en" || disc.lang === "00" ? 0 : 1;
  return [lang, type === -1 ? DISC_TYPE_ORDER.length : type, -Number(disc.likes || 0)];
}

function compare(a, b) {
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] !== rb[i]) return ra[i] - rb[i];
  }
  return 0;
}

// fanart.tv serves a ~200px preview next to every full-size image; the
// shelf never shows a disc bigger than that.
function previewUrl(url) {
  return url.replace("/fanart/", "/preview/");
}

function remember(id, value) {
  if (discCache.size >= MAX_CACHE_ENTRIES) {
    discCache.delete(discCache.keys().next().value);
  }

  discCache.set(id, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function byLangAndLikes(a, b) {
  const lang = (item) => (item.lang === "en" || item.lang === "00" ? 0 : 1);
  return lang(a) - lang(b) || Number(b.likes || 0) - Number(a.likes || 0);
}

async function getMovieArt(tmdbId) {
  if (!isConfigured() || !tmdbId) return NO_ART;

  const cached = discCache.get(tmdbId);
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  try {
    const url = new URL(`${BASE_URL}/movies/${encodeURIComponent(tmdbId)}`);
    url.searchParams.set("api_key", process.env.FANART_API_KEY);

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    // 404 means fanart.tv has nothing for this movie: cache that too
    if (response.status === 404) {
      remember(tmdbId, NO_ART);
      return NO_ART;
    }

    if (!response.ok) return NO_ART;

    const data = await response.json();
    const disc = [...(data.moviedisc || [])].sort(compare)[0];
    const logo = [...(data.hdmovielogo || [])].sort(byLangAndLikes)[0];
    const value = {
      discArt: disc?.url ? previewUrl(disc.url) : null,
      titleLogo: logo?.url ? previewUrl(logo.url) : null,
    };

    remember(tmdbId, value);
    return value;
  } catch (error) {
    console.error("fanart.tv lookup failed:", error.message);
    return NO_ART;
  }
}

const albumCache = new Map();

// CD artwork for an album, by MusicBrainz release-group id (disc 1)
async function getAlbumDisc(releaseGroupId) {
  if (!isConfigured() || !releaseGroupId) return null;

  const cached = albumCache.get(releaseGroupId);
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  try {
    const url = new URL(`${BASE_URL}/music/albums/${encodeURIComponent(releaseGroupId)}`);
    url.searchParams.set("api_key", process.env.FANART_API_KEY);

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok && response.status !== 404) return null;

    const data = response.ok ? await response.json() : {};
    const discs = Object.values(data.albums || {}).flatMap((album) => album.cdart || []);
    const best = discs.sort(
      (a, b) => (a.disc === "1" ? 0 : 1) - (b.disc === "1" ? 0 : 1) || Number(b.likes || 0) - Number(a.likes || 0),
    )[0];
    const value = best?.url ? previewUrl(best.url) : null;

    if (albumCache.size >= MAX_CACHE_ENTRIES) albumCache.delete(albumCache.keys().next().value);
    albumCache.set(releaseGroupId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (error) {
    console.error("fanart.tv album lookup failed:", error.message);
    return null;
  }
}

module.exports = { isConfigured, getMovieArt, getAlbumDisc };
