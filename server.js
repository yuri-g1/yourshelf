const express = require("express");
const connectDatabase = require("./src/config/db");
const authRouter = require("./src/routes/auth");
const usersRouter = require("./src/routes/users");
const shelfRouter = require("./src/routes/shelf");
const friendshipRouter = require("./src/routes/friendship");
const searchRouter = require("./src/routes/search");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.json({ limit: "20kb" }));
app.use(authRouter);
app.use(usersRouter);
app.use(shelfRouter);
app.use(friendshipRouter);
app.use(searchRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start the server:", error.message);
    process.exit(1);
  }
}

start();
