const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  login,
  logout,
  refresh,
  githubLogin,
  githubCallback,
  getMe,
  cliExchange
} = require("../controllers/authController");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);

// GitHub OAuth
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);
router.post("/auth/cli/exchange", cliExchange)

//  user date
router.get("/me", protect, getMe);


module.exports = router;
