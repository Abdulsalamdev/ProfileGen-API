const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Profile = require("../models/Profile");
const { v7: uuidv7 } = require("uuid");

const MONGODB_URL = process.env.MONGODB_URL;

const connectDB = async () => {
  if (!MONGODB_URL) {
    throw new Error("MONGODB_URL missing in env");
  }

  await mongoose.connect(MONGODB_URL);
  console.log("MongoDB connected");
};

const seed = async () => {
  try {
    await connectDB();

    const filePath = path.join(__dirname, "../seed_profiles.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const { profiles } = JSON.parse(rawData);

    let inserted = 0;
    let skipped = 0;

    for (const p of profiles) {
      const exists = await Profile.findOne({
        name: p.name.toLowerCase().trim()
      });

      if (exists) {
        skipped++;
        continue;
      }

      await Profile.create({
        id: uuidv7(),
        name: p.name.toLowerCase().trim(),
        gender: p.gender,
        gender_probability: p.gender_probability,
        age: p.age,
        age_group: p.age_group,
        country_id: p.country_id,
        country_name: p.country_name,
        country_probability: p.country_probability,
        created_at: new Date().toISOString()
      });

      inserted++;
    }

    console.log(`Seed complete → inserted: ${inserted}, skipped: ${skipped}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seed();