const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [scheme, saltHex, keyHex] = String(storedHash || "").split("$");

  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expectedKey = Buffer.from(keyHex, "hex");
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), expectedKey.length);

  return crypto.timingSafeEqual(key, expectedKey);
}

let dummyHash = null;

async function verifyAgainstDummy(password) {
  dummyHash ??= await hashPassword(crypto.randomBytes(16).toString("hex"));
  await verifyPassword(password, dummyHash);
  return false;
}

module.exports = { hashPassword, verifyPassword, verifyAgainstDummy };
