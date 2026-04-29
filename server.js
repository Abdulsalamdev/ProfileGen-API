const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const profileRoute = require("./routes/profileRoute");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const app = express();
//connect Database
connectDB();



//Middleware
app.use(
  cors({
    origin: "*",
  }),
);

app.use(cookieParser());
app.use(express.json());

// CSRF protection (cookie-based)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "strict"
  }
});

// expose token route
app.get("/api/v1/auth/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Versioned Routes
app.use("/api/v1/profiles", profileRoute);
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

