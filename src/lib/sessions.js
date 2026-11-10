const crypto = require("crypto");
const Session = require("../models/Session");

const COOKIE_NAME = "sid";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function serializeCookie(value, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (process.env.NODE_ENV === "production") parts.push("Secure");

  return parts.join("; ");
}

function readToken(req) {
  const header = req.headers.cookie || "";

  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }

  return null;
}

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("base64url");

  await Session.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
  });

  res.setHeader("Set-Cookie", serializeCookie(token, MAX_AGE_SECONDS));
}

async function findSessionUser(req) {
  const token = readToken(req);

  if (!token) return null;

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).populate("user");

  return session?.user || null;
}

async function destroySession(req, res) {
  const token = readToken(req);

  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });

  res.setHeader("Set-Cookie", serializeCookie("", 0));
}

module.exports = { createSession, findSessionUser, destroySession };
