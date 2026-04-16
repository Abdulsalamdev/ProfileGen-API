const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")
const profileRoute = require("./routes/profileRoute")

const app = express()

//connect Database
connectDB()

//Middleware
app.use(cors({
    origin: "*"
}))
app.use(express.json())

//Routes
app.use("/api/profiles", profileRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})