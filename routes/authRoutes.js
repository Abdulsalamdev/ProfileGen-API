const express = require("express")
const router = express.Router()

const authMiddleware = require("../middleware/authMiddleware")

const {
login,
logout,
refresh
} = require("../controllers/authController")


router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", authMiddleware, logout)

module.exports = router