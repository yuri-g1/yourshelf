const express = require("express");
const User = require("../models/User");
const { hashPassword, verifyPassword, verifyAgainstDummy } = require("../lib/password");
const { createSession, destroySession } = require("../lib/sessions");
const { signupLimit, loginLimit } = require("../middlewares/rateLimiting");

const router = express.Router();

const NAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const MAX_FAILED_LOGINS = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

const failedLogins = new Map();

function clean(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isLocked(key) {
  const entry = failedLogins.get(key);

  if (!entry) return false;

  if (Date.now() > entry.resetAt) {
    failedLogins.delete(key);
    return false;
  }

  return entry.count >= MAX_FAILED_LOGINS;
}

function recordFailure(key) {
  const entry = failedLogins.get(key);

  if (!entry || Date.now() > entry.resetAt) {
    failedLogins.set(key, { count: 1, resetAt: Date.now() + LOCK_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function publicUser(user) {
  return { _id: user._id, name: user.name };
}

router.post("/auth/signup", signupLimit, async (req, res) => {
  const name = clean(req.body?.name);
  const email = clean(req.body?.email);
  const password = String(req.body?.password ?? "");

  if (!NAME_PATTERN.test(name)) {
    return res.status(400).json({
      error: "Username must be 3 to 20 characters: letters, numbers or _",
    });
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Enter a valid email" });
  }

  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return res
      .status(400)
      .json({ error: `Password must be ${MIN_PASSWORD} to ${MAX_PASSWORD} characters` });
  }

  if (await User.exists({ name })) {
    return res.status(409).json({ error: "This username is taken" });
  }

  if (await User.exists({ email })) {
    return res
      .status(409)
      .json({ error: "This email is already in use", field: "email" });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  await createSession(res, user._id);

  return res.status(201).json(publicUser(user));
});

router.post("/auth/login", loginLimit, async (req, res) => {
  const login = clean(req.body?.login);
  const password = String(req.body?.password ?? "");

  if (isLocked(login)) {
    return res
      .status(429)
      .json({ error: "Too many attempts. Try again in a few minutes" });
  }

  const filter = login.includes("@") ? { email: login } : { name: login };
  const user = await User.findOne(filter).select("+passwordHash");

  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyAgainstDummy(password);

  if (!valid) {
    recordFailure(login);
    return res.status(401).json({ error: "Invalid username, email or password" });
  }

  failedLogins.delete(login);
  await createSession(res, user._id);

  return res.json(publicUser(user));
});

router.post("/auth/logout", async (req, res) => {
  await destroySession(req, res);
  return res.status(204).end();
});

module.exports = router;
