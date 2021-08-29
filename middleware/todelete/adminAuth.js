const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../../models");
const Doctor = db.doctor



const adminAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        let adminDoctor = await Doctor.findOne({ raw: true, where: { id: decoded.id, username: decoded.username, 'token': token } })

        if (!adminDoctor) {
            throw new Error('No doctor with this info....')
        } else {

            if (adminDoctor.docType != "Admin") {

                throw new Error('you can not go there ,you are not admin ....')
            } else {
                req.token = token
                req.adminDoctor = adminDoctor
                next()
            }
        }

    } catch (e) {
        res.status(401).send('Plaese Auth')
    }


}

module.exports = adminAuth