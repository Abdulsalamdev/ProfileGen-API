const csrf = require("csurf");

// CSRF protection (cookie-based)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "strict"
  }
});

module.exports = csrfProtection