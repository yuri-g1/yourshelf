const express = require("express");
const { detailsLimit } = require("../middlewares/rateLimiting");
const { catalogs } = require("../lib/catalogs");

const router = express.Router();

const REGION = /^[A-Z]{2}$/;

function regionOf(raw) {
  const region = String(raw ?? "").toUpperCase();
  return REGION.test(region) ? region : "US";
}

for (const catalog of Object.values(catalogs)) {
  const unavailable = `${catalog.noun[0].toUpperCase()}${catalog.noun.slice(1)} details are not available right now`;
  const missing = `We could not find that ${catalog.noun}`;

  router.get(`/${catalog.plural}/:externalId/details`, detailsLimit, async (req, res) => {
    const externalId = String(req.params.externalId);

    if (!catalog.idPattern.test(externalId)) {
      return res.status(400).json({ error: `Invalid ${catalog.noun} id` });
    }

    if (!catalog.isConfigured()) {
      return res.status(503).json({ error: unavailable });
    }

    try {
      const details = await catalog.details(externalId, regionOf(req.query.region));

      if (!details) return res.status(404).json({ error: missing });

      res.set("Cache-Control", "public, max-age=600");
      return res.json(details);
    } catch (error) {
      if (catalog.isSourceError(error) && error.status === 404) {
        return res.status(404).json({ error: missing });
      }

      if (catalog.isSourceError(error) || error.name === "TimeoutError") {
        console.error(`${catalog.source} details failed:`, error.message);
        return res.status(502).json({ error: unavailable });
      }

      throw error;
    }
  });
}

module.exports = router;
