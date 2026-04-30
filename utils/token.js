const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// generating access token
const generateAccessToken = (user) => {
  return jwt.sign(  {
      id: user.id,
      role: user.role,
      email: user.email
    }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

// generating refresh token
const generateRefreshToken = (user) => {
  return jwt.sign({
      id: user.id,
      role: user.role,
    }, REFRESH_SECRET, { expiresIn: "7d" });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verfyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  verfyRefreshToken,
  verifyAccessToken,
  generateRefreshToken,
};
