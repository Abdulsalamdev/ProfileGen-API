const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    github_id: {
      type: String,
      unique: true,
    },
    username: String,
    role: {
      type: String,
      enum: ["admin", "analyst"],
      default: "analyst",
    },
    refresh_token: String,
    created_at: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
