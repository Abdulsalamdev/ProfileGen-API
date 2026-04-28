const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles
} = require("../controllers/profileController");

const auth = require("../middleware/authMiddleware")
const requireRole = require("../middleware/roleMiddleware")

// Create profile
router.post("/", createProfile);

// Get all profiles (filter + sort + pagination)
router.get("/", auth,getAllProfiles);

// search 
router.get("/search", auth,searchProfiles);

// Get single profile
router.get("/:id", getProfile);

// Delete profile
router.delete("/:id", deleteProfile);



module.exports = router;