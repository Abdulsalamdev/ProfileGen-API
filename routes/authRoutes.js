const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
// const authorise = require("../middleware/roleMiddleware");

const {
  login,
  logout,
  refresh,
  githubLogin,
  githubCallback,
  getMe
} = require("../controllers/authController");
const csrfProtection = require("../middleware/csrf");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);

// GitHub OAuth
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
router.get("/me", protect, getMe);

module.exports = router;
