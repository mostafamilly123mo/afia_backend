const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../models");
const Secretara = db.secretara


const secUserAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        let secretara = await Secretara.findOne({ raw: true, where: { id: decoded.id, username: decoded.username, 'token': token } })

        if (!secretara) {
            throw new Error('No secretara with this info....')
        } else {

            if (secretara.secType != "Secretara") {

                throw new Error('you can not go there ,you are not Secretara ....')
            } else {
                req.token = token
                req.secretara = secretara
                next()
            }
        }

    } catch (e) {
        res.status(401).send('Plaese Auth' + e)
    }


}

module.exports = secUserAuth