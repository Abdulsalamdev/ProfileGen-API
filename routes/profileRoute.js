const express = require("express");
const router = express.Router();

const {
  createProfile,
  getProfile,
  getAllProfiles,
  deleteProfile,
  searchProfiles,
  exportProfiles,
  uploadProfiles
} = require("../controllers/profileController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

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

// upload profiles via CSV
router.post("/upload", protect, upload.single("file"), uploadProfiles);

// Get single profile
router.get("/:id", getProfile);

// Delete profile
router.delete("/:id",protect, authorize("admin"), deleteProfile);

module.exports = router;

