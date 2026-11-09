function errorHandler(error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ error: `Invalid value for ${error.path}` });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: "Duplicate value" });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;
