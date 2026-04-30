const mongoose = require("mongoose");
const User = require("../models/User");
const { v7: uuidv7 } = require("uuid");
require("dotenv").config();

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB connected");

    // prevent duplicates cleanly
    await User.deleteMany({});

    await mongoose.connection.dropDatabase();
    await User.insertMany([
      {
        id: uuidv7(),
        email: "admin@insighta.com",
        role: "admin",
        refresh_token: null,
      },
      {
        id: uuidv7(),
        email: "analyst@insighta.com",
        role: "analyst",
        refresh_token: null,
      },
    ]);

    console.log(" Users seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedUsers();