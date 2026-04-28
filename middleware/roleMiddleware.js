module.exports = (role) => {
    return (req,res,next) => {
        if(req.user.role !== role) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden"
            })

        }
        next()
    }
}