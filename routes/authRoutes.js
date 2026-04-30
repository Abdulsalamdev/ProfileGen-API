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
} = require("../controllers/authController");
const csrfProtection = require("../middleware/csrf");

router.post("/login", login);
router.post("/refresh", csrfProtection, refresh);
router.post("/logout", protect, csrfProtection, logout);

// GitHub OAuth
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router;
