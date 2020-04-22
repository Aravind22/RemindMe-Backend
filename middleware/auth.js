const jwt = require('jsonwebtoken')
require('../model/user')
var user = require('mongoose').model('user')

const auth = async (req, res, next) => {
    var token = req.header('Authorization')
    if (token == undefined) {
        res.status(200).json({ message: "Not Authorized to access this resource without a valid token" })
    } else {
        token = token.replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        try {
            const usr = await user.findOne({ email: data.email })
            if (!usr) {
                res.status(200).json({ message: "User not registered" });
            }
            req.user = usr
            req.token = token
            next()
        } catch (error) {
            console.log(error)
            res.status(401).send({ error: 'Not Authorized to access this resource' })
        }
    }
}

    module.exports = auth;