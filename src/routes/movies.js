const express = require("express");
const { identifyUser } = require("../middlewares/IdentifyUser");
const { searchLimit } = require("../middlewares/rateLimiting");
const tmdb = require("../lib/tmdb");

const router = express.Router();

router.get("/movies/search", identifyUser, searchLimit, async (req, res) => {
  const query = String(req.query.q ?? "").trim();

  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ error: "Search must be 2 to 100 characters" });
  }

  if (!tmdb.isConfigured()) {
    return res.status(503).json({ error: "Movie search is not available right now" });
  }

  try {
    return res.json(await tmdb.searchMovies(query));
  } catch (error) {
    if (error instanceof tmdb.TmdbError || error.name === "TimeoutError") {
      console.error("TMDB search failed:", error.message);
      return res.status(502).json({ error: "Movie search is not available right now" });
    }

    throw error;
  }
});

module.exports = router;
