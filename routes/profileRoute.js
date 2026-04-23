const express = require("express")
const router = express.Router()


const {
    createProfile,
    deleteProfile,
    getProfile,
    getAllProfiles
} = require("../controllers/profileController")
const { searchProfiles } = require("../controllers/searchController")

router.post("/", createProfile)
router.get("/search", searchProfiles)
router.get("/:id", getProfile)
router.get("/",getAllProfiles)
router.delete("/:id", deleteProfile)


module.exports = router