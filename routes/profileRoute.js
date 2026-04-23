const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles
} = require("../controllers/profileController");

// Create profile
router.post("/", createProfile);

// Get all profiles (filter + sort + pagination)
router.get("/", getAllProfiles);

// search 
router.get("/search", searchProfiles);

// Get single profile
router.get("/:id", getProfile);

// Delete profile
router.delete("/:id", deleteProfile);



module.exports = router;