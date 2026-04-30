const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },

    github_id: {
      type: String,
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "analyst"],
      default: "analyst",
    },

    refresh_token: {
      type: String,
      index: true, // 🔥 important
    },
  },
  {
    timestamps: true, // use createdAt instead
  }
);

module.exports = mongoose.model("User", userSchema);