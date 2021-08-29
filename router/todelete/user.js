const express = require('express')

//Loading Models 
const db = require("../../models");
const User = db.user;
const Doctor = db.doctor
const Patient = db.patient

//Auth Middleware
const Auth = require('../../middleware/Authentication/Auth')

const router = express.Router()

//Post :Create doctor account by Admin 
router.post('/Signup', async(req, res) => {
    let user = new User(req.body)
    let doctor = new Doctor(req.body)
    try {
        await user.save()
        user.token = await user.generateAuthJWT()
        doctor.userId = user.id
        await doctor.save()
        res.status(201).json({ DoctorData: doctor, MainData: user })
    } catch (e) {
        res.status(403).json({ message: `${e}` })
    }
})


//Post :Create patient account by Nurse 
router.post('/P_Signup', async(req, res) => {
    let user = new User(req.body)
    let patient = new Patient(req.body)
    try {
        await user.save()
        user.token = await user.generateAuthJWT()
        patient.userId = user.id
        await patient.save()
        res.status(201).json({ PatientData: patient, MainData: user })
    } catch (e) {
        res.status(403).json({ message: `${e}` })
    }
})

//Get Doctor 
router.get('/Profile/id/:id', Auth(['Patient', 'Nurse']), async(req, res) => {
    const id = req.params.id
    try {
        const doctorInfo = await Doctor.findOne({
            where: { id },
            include: [{
                model: User,
                //as: 'userA',
                //all: true
            }]
        })
        res.status(200).json(doctorInfo)
    } catch (e) {
        res.status(403).send(e.message)


    }

})

/*
//test
router.post('/create_user', async(req, res) => {
    try {
        const user = new User(req.body)

        await user.save()
            //user.token = await user.generateAuthJWT()
        res.status(200).json(user)
    } catch (e) {
        res.status(403).json({ message: `error${e}` })
    }
})

//Secretara: creating new user account :Done
router.post('/create_user_account', secUserAuth, async(req, res) => {
    const user = new User(req.body)
    try {
        if (await user.ckeckUsernameIsValid(user.username))
            await user.save()
        const token = await user.generateAuthJWT()
        res.status(200).json(user.getPublicProfile())
    } catch (e) {
        res.status(403).json({ message: `error${e}` })
    }
})


//Any User signin :Done
router.post('/signin', async(req, res) => {
    console.log(req.body)
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthJWT()
        res.status(200).json(user.getPublicProfile())
    } catch (e) {
        res.status(403).json({ message: `error${e}` })
    }
})

//Any User Profile :Done
router.get('/me', userAuth, async(req, res) => {
    res.status(200).json({ me: req.user.getPublicProfile() })
})

//Any User logout :Done
router.post('/logout', userAuth, async(req, res) => {
    try {
        req.user.token = ''
        await req.user.save()
        res.status(200).json({ message: 'Logout done.....' })
    } catch (e) {
        res.status(403).json({ message: e })
    }

})
*/

module.exports = router