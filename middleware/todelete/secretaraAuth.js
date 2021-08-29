const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../models");
const Secretara = db.secretara


const secretaraAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        const secretara = await Secretara.findOne({ where: { id: decoded.id, username: decoded.username, 'token': token } })

        if (!secretara) {
            throw new Error('No secretara with this data ....')
        }
        req.token = token
        req.secretara = secretara
        next()
    } catch (e) {
        res.status(401).send('Plaese Auth' + e)
    }


}

module.exports = secretaraAuth