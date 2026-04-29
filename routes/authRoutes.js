const express = require("express")
const router = express.Router()

const authMiddleware = require("../middleware/authMiddleware")

const {
login,
logout,
refresh,
githubLogin,
githubCallback
} = require("../controllers/authController")
const csrfProtection = require("../middleware/csrf")


router.post("/login", login)
router.post("/refresh", csrfProtection,refresh)
router.post("/logout", authMiddleware,csrfProtection, logout)

// GitHub OAuth
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router