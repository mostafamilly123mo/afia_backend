const jwt = require('jsonwebtoken')

//Loading Models 
const db = require("../models");
const Doctor = db.doctor


const doctorAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        const doctor = await Doctor.findOne({ where: { id: decoded.id, username: decoded.username, 'token': token } })

        if (!doctor) {
            throw new Error('No doctor with this data ....')
        }
        req.token = token
        req.doctor = doctor
        next()
    } catch (e) {
        res.status(401).send('Plaese Auth')
    }


}

module.exports = doctorAuth