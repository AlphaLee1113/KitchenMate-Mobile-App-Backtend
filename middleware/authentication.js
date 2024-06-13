const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
    try {
        let accessToken = req.headers.authorization
        if (!accessToken || accessToken.split(' ')[0] !== 'Bearer') throw {code: 401, error: "No token provided"}
        accessToken = accessToken.split(' ')[1]
        const verify = jwt.verify(accessToken, process.env.JWT_KEY, (error, decoded) => {
            if (error) {
                throw new Error(error.message)
            }
            return decoded
        })

        if (verify === "token expired") {
            return res.status(401).json({code: 401, error: "Token expired"})
        }

        res.username = verify.username

        next()
    } catch (error) {
        if (error.code) res.status(error.code).json({status: error.code, error: error.error})
        else res.status(500).json({status: 500, error: error.message})
    }
}

module.exports = verifyToken