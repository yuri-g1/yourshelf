const { findSessionUser } = require("../lib/sessions");

async function identifyUser(req, res, next) {
  const user = await findSessionUser(req);

  if (!user) {
    return res.status(401).json({ error: "Sign in required" });
  }

  req.user = user;
  next();
}

async function optionalUser(req, res, next) {
  req.user = await findSessionUser(req);
  next();
}

module.exports = { identifyUser, optionalUser };
