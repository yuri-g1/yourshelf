const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new Error(
      "MONGODB_URL is not defined. Create a .env file based on .env.example.",
    );
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

module.exports = connectDatabase;
