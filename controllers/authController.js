const User = require("../models/User")
const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/token")


// login endpoint
exports.login = async (req,res) =>{
    try {
        const {username,role} = req.body

        if(!username) {
            return res.status(400).json({
                status: "error",
                message: "Username required"
            })
        }

        // find or create user
        let user = await User.findOne({username})

        if(!user) {
            user = await User.create({
                username,
                role: role || "analyst"
            })
        }

        const accessToken = generateAccessToken(user)
        const refreshToken =  generateRefreshToken(user)

        user.refresh_token = refreshToken;
        await user.save()

        return res.status(200).json({
            status: "success",
            data: {
                access_token: accessToken,
                refresh_token: refreshToken
            }
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        })
    }
}

// refresh token endpoint
exports.refresh = async (req,res) => {
    try{
        const {refresh_token} = req.body

        if(!refresh_token) {
            return res.status(400).json({
                status: "error",
                message: "Rferesh token required"
            })

            const decoded = require("jsonwebtoken").verify(
                refresh_token,
                process.env.JWT_REFRESH_SECRET
            )

            const user = await User.findById(decoded.id)

            if(!user || user.refresh_token !== refresh_token) {
                return res.status(401).json({
                    status: "error",
                    message: "Invalid refresh token"
                })
            }

            // rotate token
            const newAccessToken = generateAccessToken(user)
            const newRefreshToken = generateRefreshToken(user)

            user.refresh_token = newRefreshToken
            await user.save();

            return res.status(200).json({
                status: "success",
                data: {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken
                }
            })
        }
    }catch(err) {
        console.log(err)
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired refresh token"
        })
    }
}

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
      message: "Logged out successfully"
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

