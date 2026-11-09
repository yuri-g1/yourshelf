const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const user = await User.create({ name: req.body?.name });
    return res.status(201).json(user);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: "This name is already in use" });
    }

    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("name");
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
