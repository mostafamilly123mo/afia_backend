const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../models");
const User = db.user;

const userAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        const user = await User.findOne({ where: { username: decoded.username } })

        if (!user) {
            throw new Error('No user with this data ....')
        }
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send('Plaese Auth' + e)
    }


}

module.exports = userAuth