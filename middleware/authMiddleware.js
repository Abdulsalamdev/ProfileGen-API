const jwt = require("jsonwebtoken")


exports.protect = (req,res,next) => {
    try {
        const authHeader = req.headers.authorization
        const cookieHeader = req.cookies?.access_token
        

        if(!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized"
            })
        }

        const token = authHeader.split(" ")[1] || cookieHeader

        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        req.user = decoded

        next()
    } catch(err) {
        return res.status(401).json({
            status: "error",
            message: "Invalid token"
        })
    }
}