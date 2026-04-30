const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");
const axios = require("axios");
const { v7: uuidv7 } = require("uuid");

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

    return res
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
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

    const decoded = verifyRefreshToken(refresh_token);

    const user = await User.findOne(decoded.id);

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
    const user = await User.findById(req.user.id);

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
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        status: "error",
        message: "Missing code",
      });
    }

    // Exchange code for GitHub token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
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
        id: uuidv7(),
        github_id: githubUser.id,
        username: githubUser.login,
        role: "analyst",
      });
    }

    // Generate YOUR tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "authentication failed",
    });
  }
};
