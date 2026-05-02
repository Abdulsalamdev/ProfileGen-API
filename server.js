const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const profileRoutes = require("./routes/profileRoute");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Connect DB
connectDB();

// Rate limiting (IMPORTANT)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // max requests per IP
  message: {
    status: "error",
    message: "Too many requests, try again later",
  },
});
app.use(limiter);

// CORS 
app.use(
  cors({
    // origin: "*",
    origin: ["http://localhost:5173", "https://insighta-web-mu-two.vercel.app"],
    credentials: true,
  })
);

// app.options("/*", cors()); // valid

// security header
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());

// Logging
app.use(morgan("dev"));

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "none",
    secure: true, // set true in production
  },
});

// expose CSRF token
app.get("/api/v1/auth/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF to sensitive routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profiles",profileRoutes);

// Root test
app.get("/", (req, res) => {
  res.send("Insighta API running...");
});

// Global error handler (MUST BE LAST)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});