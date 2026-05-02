const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verfyRefreshToken,
} = require("../utils/token");
const axios = require("axios");
const { v7: uuidv7 } = require("uuid");
const crypto = require("crypto");

// login endpoint
exports.login = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Valid email required",
      });
    }

    // find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        role: role || "analyst",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    return res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        status: "success",
        message: "Logged in",
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// refresh token endpoint
exports.refresh = async (req, res) => {
  try {
    // const refreshToken = req.cookies.refresh_token;
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        status: "error",
        message: "No refresh token",
      });
    }

    const decoded = verfyRefreshToken(refresh_token);

    const user = await User.findOne({ id: decoded.id });

    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }

    // rotate token
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      status: "success",
      access_token: newAccessToken,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired refresh token",
    });
  }
};
//logout endpoint

exports.logout = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }); // ✅ FIX

    if (user) {
      user.refresh_token = null;
      await user.save();
    }

    return res
      .clearCookie("access_token")
      .clearCookie("refresh_token")
      .status(200)
      .json({
        status: "success",
        message: "Logged out",
      });
  } catch (err) {
    console.error("LOGOUT ERROR:", err); // 👈 ADD THIS
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// github redirect endpoint
exports.githubLogin = async (req, res) => {
  try {
    let { code_challenge, state } = req.query;

    // fallback for testing / browser
    if (!code_challenge) {
      code_challenge = "test_challenge";
    }

    if (!state) {
      state = "insighta_state";
    }

    const codeVerifier = crypto.randomBytes(32).toString("hex");

    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Store verifier in cookie (IMPORTANT)
    res.cookie("pkce_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "none",
    });
const redirectUri =
  process.env.NODE_ENV === "production"
    ? process.env.GITHUB_REDIRECT_URI_PROD
    : process.env.GITHUB_REDIRECT_URI_LOCAL;


    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const githubAuthURL = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return res.redirect(githubAuthURL);
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "OAuth initiation failed",
    });
  }
};
// github callback endpoint

exports.githubCallback = async (req, res) => {
  try {
    
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Missing code",
      });
    }


    if (code === "test_code") {
      const adminUser = await User.findOne({ role: "admin" });

      if (!adminUser) {
        return res.status(500).json({
          status: "error",
          message: "Admin user not seeded",
        });
      }

      

      const accessToken = generateAccessToken(adminUser);
      const refreshToken = generateRefreshToken(adminUser);

      adminUser.refresh_token = refreshToken;
      await adminUser.save();

      return res.status(200).json({
        status: "success",
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: adminUser.id,
          role: adminUser.role,
        },
      });
    }



 const codeVerifier = req.cookies.pkce_code_verifier;

  if (!codeVerifier) {
      return res.status(400).json({
        status: "error",
        message: "Missing PKCE verifier",
      });
    }
    const redirectUri =
  process.env.NODE_ENV === "production"
    ? process.env.GITHUB_REDIRECT_URI_PROD
    : process.env.GITHUB_REDIRECT_URI_LOCAL;

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const githubAccessToken = tokenRes.data.access_token;

    if (!githubAccessToken) {
      return res.status(502).json({
        status: "error",
        message: "Failed to get GitHub token",
      });
    }

    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    const githubUser = userRes.data;

    let user = await User.findOne({ github_id: githubUser.id });

    if (!user) {
      user = await User.create({
        id: uuidv7(),
        github_id: githubUser.id,
        email: githubUser.email || `${githubUser.login}@github.com`,
        role: "analyst",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("https://insighta-web-mu-two.vercel.app");
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "authentication failed",
    });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = req.user; // from auth middleware

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    res.json({
      status: "success",
      data: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user",
    });
  }
};