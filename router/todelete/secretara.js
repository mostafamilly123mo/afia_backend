const express = require('express')

//Loading Models 
const db = require("../../models");
const Secretara = db.secretara;

//Auth Middleware
const adminAuth = require('../middleware/adminAuth')
const secretaraAuth = require('../middleware/secretaraAuth')

const router = express.Router()




module.exports = router



/*
//Admin: creating new secretara account :Done
router.post('/create_secretara_account', adminAuth, async(req, res) => {
    const secretara = new Secretara(req.body)
    try {
        if (await secretara.ckeckUsernameIsValid(secretara.username))
            await secretara.save()
        const token = await secretara.generateAuthJWT()
        res.status(200).json(secretara.getPublicProfile())
    } catch (e) {
        res.status(400).json({ message: `error${e}` })
    }
})

//Admin: delete secretara by username :Done
router.delete('/delete_account/:username', adminAuth, async(req, res) => {
    const username = req.params.username
    try {
        const secretara = await Secretara.destroy({ where: { username } })
        if (!secretara) {
            res.status(404).json({ message: 'No secretara with this data....' })
        }
        res.status(200).json({ message: 'Delele secretara done.....' })
    } catch (e) {
        res.status(200).json({ message: e })
    }
})

//Any secretara signin :Done
router.post('/signin', async(req, res) => {
    try {
        const secretara = await Secretara.findByCredentials(req.body.username, req.body.password)
        const token = await secretara.generateAuthJWT()
        res.status(200).json(secretara.getPublicProfile())
    } catch (e) {
        res.status(400).json({ message: `error${e}` })
    }
})

//Any secretara Profile :Done
router.get('/me', secretaraAuth, async(req, res) => {
    res.status(200).json({ me: req.secretara.getPublicProfile() })
})

//Any secretara logout :Done
router.post('/logout', secretaraAuth, async(req, res) => {
    try {
        req.secretara.token = ''
        await req.secretara.save()
        res.status(200).json({ message: 'Logout done.....' })
    } catch (e) {
        res.status(400).json({ message: e })
    }

})
*/