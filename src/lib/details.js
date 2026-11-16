const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function createCache(ttlMs, maxEntries = 500) {
  const entries = new Map();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (Date.now() < entry.expiresAt) return entry.value;
      entries.delete(key);
      return undefined;
    },
    set(key, value) {
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    },
  };
}

function formatDate(date) {
  const [year, month, day] = String(date || "").slice(0, 10).split("-").map(Number);
  if (!year) return null;
  if (!month) return String(year);
  if (!day) return `${MONTHS[month - 1]} ${year}`;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function formatLength(seconds) {
  const total = Math.round(Number(seconds) || 0);
  if (total <= 0) return null;

  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatClock(seconds) {
  const total = Math.round(Number(seconds) || 0);
  if (total <= 0) return null;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatMoney(amount) {
  if (!amount || amount <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatCount(count) {
  if (!count || count <= 0) return null;
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(count);
}

function joinNames(names, limit = 3) {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return null;
  return unique.slice(0, limit).join(", ");
}

function fact(label, value) {
  return value ? { label, value: String(value) } : null;
}

function compact(list) {
  return list.filter(Boolean);
}

function youtubeVideo(key, name) {
  return { key, name: name || "Video", thumb: `https://i.ytimg.com/vi/${key}/hqdefault.jpg` };
}

module.exports = {
  createCache,
  formatDate,
  formatLength,
  formatClock,
  formatMoney,
  formatCount,
  joinNames,
  fact,
  compact,
  youtubeVideo,
};
