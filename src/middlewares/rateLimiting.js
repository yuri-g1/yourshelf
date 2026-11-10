const MINUTE = 60 * 1000;

const counters = new Map();

setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of counters) {
    if (now > entry.resetAt) counters.delete(key);
  }
}, MINUTE).unref();

function clientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : req.ip;
}

function rateLimiting({ name, max, windowMs, by = "ip" }) {
  return (req, res, next) => {
    const who = by === "user" && req.user ? String(req.user._id) : clientIp(req);
    const key = `${name}:${who}`;
    const now = Date.now();
    const entry = counters.get(key);

    if (!entry || now > entry.resetAt) {
      counters.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res
        .status(429)
        .json({ error: "Too many requests. Try again in a few minutes" });
    }

    entry.count += 1;
    next();
  };
}

const signupLimit = rateLimiting({ name: "signup", max: 5, windowMs: 60 * MINUTE });
const loginLimit = rateLimiting({ name: "login", max: 20, windowMs: 15 * MINUTE });
const writeLimit = rateLimiting({ name: "write", max: 60, windowMs: MINUTE, by: "user" });

module.exports = { rateLimiting, signupLimit, loginLimit, writeLimit };
