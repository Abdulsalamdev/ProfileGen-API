const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },

  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },

  gender_probability: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },

  age: {
    type: Number,
    min: 0,
    required: true,
  },

  age_group: {
    type: String,
    enum: ["child", "teenager", "adult", "senior"],
    required: true,
  },

  country_id: {
    type: String,
    uppercase: true,
    minlength: 2,
    maxlength: 2,
    required: true,
  },

  country_name: {
    type: String,
    required: true,
  },

  country_probability: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

// 🔥 Compound indexes (HIGH IMPACT)
profileSchema.index({ gender: 1, country_id: 1 });
profileSchema.index({ age: 1, country_id: 1 });
profileSchema.index({ age_group: 1, gender: 1 });

// Sorting optimization
profileSchema.index({ created_at: -1 });
profileSchema.index({ age: 1 });
profileSchema.index({ gender_probability: 1 });

module.exports = mongoose.model("Profile", profileSchema);