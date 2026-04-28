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


router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", authMiddleware, logout)

// GitHub OAuth
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router