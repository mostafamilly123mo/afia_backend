const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../models");
const User = db.user;
const Secretara = db.secretara

const userAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        const user = await User.findOne({ where: { username: decoded.username } })
        const secretara = await Secretara.findOne({ where: { username: decoded.username } })

        if (user) {
            req.token = token
            req.user = user
        } else {
            req.user = {}
        }

        if (secretara) {
            req.token = token
            req.secretara = secretara
        }

        if (secretara || user) {
            next()
        }

        if (!secretara && !user)
            throw new Error('No user with this data ....')

    } catch (e) {
        res.status(401).send('Plaese Auth' + e)
    }


}

module.exports = userAuth