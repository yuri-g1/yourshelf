const express = require("express");
const { identifyUser } = require("../middlewares/IdentifyUser");
const { searchLimit } = require("../middlewares/rateLimiting");
const { catalogs } = require("../lib/catalogs");

const router = express.Router();

for (const catalog of Object.values(catalogs)) {
  const unavailable = `${catalog.noun[0].toUpperCase()}${catalog.noun.slice(1)} search is not available right now`;

  router.get(`/${catalog.plural}/search`, identifyUser, searchLimit, async (req, res) => {
    const query = String(req.query.q ?? "").trim();

    if (query.length < 2 || query.length > 100) {
      return res.status(400).json({ error: "Search must be 2 to 100 characters" });
    }

    if (!catalog.isConfigured()) {
      return res.status(503).json({ error: unavailable });
    }

    try {
      return res.json(await catalog.search(query));
    } catch (error) {
      if (catalog.isSourceError(error) || error.name === "TimeoutError") {
        console.error(`${catalog.source} search failed:`, error.message);
        return res.status(502).json({ error: unavailable });
      }

      throw error;
    }
  });
}

module.exports = router;
