const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const axios = require("axios");

// login endpoint
exports.login = async (req, res) => {
  try {
    const { username, role } = req.body;

    if (!username) {
      return res.status(400).json({
        status: "error",
        message: "Username required",
      });
    }

    // find or create user
    let user = await User.findOne({ username });

    if (!user) {
      user = await User.create({
        username,
        role: role || "analyst",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    return res.status(200).json({
      status: "success",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
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
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        status: "error",
        message: "Rferesh token required",
      });

      const decoded = require("jsonwebtoken").verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET,
      );

      const user = await User.findById(decoded.id);

      if (!user || user.refresh_token !== refresh_token) {
        return res.status(401).json({
          status: "error",
          message: "Invalid refresh token",
        });
      }

      // rotate token
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      user.refresh_token = newRefreshToken;
      await user.save();

      return res.status(200).json({
        status: "success",
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
      });
    }
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
    const user = await User.findById(req.user.id);

    if (user) {
      user.refresh_token = null;
      await user.save();
    }

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// github redirect endpoint
exports.githubLogin = async (req, res) => {
  try {
    const { code_challenge } = req.query;

    if (!code_challenge) {
      return res.status(400).json({
        status: "error",
        message: "Missing code_challenge",
      });
    }

    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=read:user&code_challenge=${code_challenge}&code_challenge_method=S256`;

    return res.redirect(url);
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
    const { code, code_verifier } = req.query;

    if (!code || !code_verifier) {
      return res.status(400).json({
        status: "error",
        message: "Missing code or verifier",
      });
    }

    // Exchange code for GitHub token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        code_verifier,
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

    // Fetch GitHub user
    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    const githubUser = userRes.data;

     // Find or create user
    let user = await User.findOne({ github_id: githubUser.id });

    if (!user) {
      user = await User.create({
        github_id: githubUser.id,
        username: githubUser.login,
        role: "analyst"
      });
    }

    // Generate YOUR tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    return res.status(200).json({
      status: "success",
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "OAuth failed"
    });
  }
};
