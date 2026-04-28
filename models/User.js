const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema)