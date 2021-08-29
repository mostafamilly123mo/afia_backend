const jwt = require('jsonwebtoken')

//Loading Models 
const db = require('../../models');
const User = db.user



const anyOneAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, 'clinic')
        let user = await User.findOne({ where: { id: decoded.id, username: decoded.username, type: decoded.type } })

        if (!user) {
            throw new Error('No user this data....')
        } else {
            req.token = token
            req.user = user
            next()
        }

    } catch (e) {
        res.status(401).send('Plaese Auth' + e)
    }


}

module.exports = anyOneAuth