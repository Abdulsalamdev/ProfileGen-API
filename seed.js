const mongoose = require("mongoose");
const Profile = require("./models/Profile");
const data = require("./seed_profiles.json");
const { v7: uuidv7 } = require("uuid");

require("dotenv").config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URL);

  for (const p of data.profiles) {
    const exists = await Profile.findOne({ name: p.name });

    if (!exists) {
      await Profile.create({
        id: uuidv7(),
        ...p,
        created_at: new Date().toISOString()
      });
    }
  }

  console.log("Seeding complete");
  process.exit();
}

seed();