const jwt = require("jsonwebtoken")


// generating access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {id: user._id, role: user.role},
    process.env.JWT_SECRET,
    {
        expiresIn: "15m"
    }
  )
}

// generating refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(
        {id: user._id,},
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: "7d"}
    )
}


module.exports = {
    generateAccessToken,
    generateRefreshToken
}