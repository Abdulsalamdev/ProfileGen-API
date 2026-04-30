const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles,
  exportProfiles
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Create profile
router.post("/",protect,createProfile);

// Get all profiles (filter + sort + pagination)
router.get("/",protect, getAllProfiles);

// search
router.get("/search",protect, searchProfiles);

// export profile
router.get(
  "/export",
  protect,
  authorize("admin"),
  exportProfiles
);

// Get single profile
router.get("/:id", getProfile);

// Delete profile
router.delete("/:id",protect, authorize("admin"), deleteProfile);

module.exports = router;

