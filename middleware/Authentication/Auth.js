const jwt = require('jsonwebtoken')

//Loading Models 
const db = require('../../models');
const User = db.user

function Auth(Types) {
    return async function(req, res, next) {
        try {
            const token = req.header('Authorization').replace('Bearer ', '')
            const decoded = jwt.verify(token, 'clinic')
            let user = await User.findOne({ where: { id: decoded.id, username: decoded.username, type: decoded.type } })

            if (!user) {
                throw new Error('No user have this data.')
            }

            let accepted = 0
            for (let item = 0; item < Types.length; item++) {

                if (user.type === Types[item]) {
                    accepted = 1
                    break
                }
            }

            if (!accepted) {
                throw new Error('You can not access this page.')
            } else {
                req.token = token
                req.user = user
                next()
            }

        } catch (e) {
            res.status(401).send('Plaese Auth' + e)
        }

    }
}

module.exports = Auth