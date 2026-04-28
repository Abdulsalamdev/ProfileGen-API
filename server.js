const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const profileRoute = require("./routes/profileRoute");
const authRoutes = require("./routes/authRoutes");

const app = express();

//connect Database
connectDB();

//Middleware
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

// Versioned Routes
app.use("/api/v1/profiles", profileRoute);
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
