const mongoose = require("mongoose");
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);

  const admin = await User.findOne({ role: "admin" });
  const analyst = await User.findOne({ role: "analyst" });

  const adminAccess = generateAccessToken(admin);
  const adminRefresh = generateRefreshToken(admin);

  const analystAccess = generateAccessToken(analyst);

  console.log("\n===== SUBMISSION TOKENS =====\n");

  console.log("ADMIN ACCESS TOKEN:\n", adminAccess);
  console.log("\nADMIN REFRESH TOKEN:\n", adminRefresh);
  console.log("\nANALYST ACCESS TOKEN:\n", analystAccess);

  process.exit(0);
}

run();