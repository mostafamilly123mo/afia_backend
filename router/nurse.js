const express = require('express')

//Loading Models 
const db = require("../models");

let User = db.user
let Doctor = db.doctor
let Patient = db.patient
let Appointment = db.appointment
let Session = db.session
let Consultation = db.consultation
let Clinic = db.clinic
let CenterDay = db.centerday
let CenterHoliday = db.centerholiday
let DoctorDay = db.doctorday
let DoctorHoliday = db.doctorholiday
let WorkingDay = db.workingday
let Tag = db.tag
let Photo = db.photo
let PhotosCategory = db.photoscategory
let Review = db.review
let Log = db.log
let Calendar = db.calendar


//Auth Middleware
const Auth = require('../middleware/Authentication/Auth')

//Helper Function
const TryCatch = require('../middleware/Error/TryCatch')
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')

//Var 
let UserInfo = ['id', 'username', 'email', 'type']
//const DoctorWorkingDays = db.doctorworkingdays

const router = express.Router()

//Post :Create nurse account by admin 
router.post('/Signup', Auth(['Admin']), TryCatch(async (req, res) => {

    const { error } = User.validate(req.body)
    if (error) return SendResponseWithMessage(res, 400, error.details[0].message)

    let user = new User(req.body)

    await user.save()
    let token = User.generateAuthJWT(user)
    res.setHeader('Access-Control-Expose-Headers', "x-token")
    res.header('x-token', 'Bearer ' + token).status(201).json({ NurseData: user.getPublicProfile() })
})
)

//Get all nurses
router.get('/', Auth(['Admin']), TryCatch(async (req, res) => {
    let nurses = await User.findAll({
        where: { type: 'Nurse' },
        attributes: UserInfo
    })
    if (nurses.length === 0) {
        return SendResponseWithMessage(res, 404, "There are no nurses.")
    }
    return SendResponse(res, 200, nurses)
}))

//Update nurse data 
router.patch('/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {

    let id = req.params.id
    let user = await User.findOne({ where: { id, type: 'Nurse' } })
    if (!user)
        SendResponseWithMessage(res, 404, "لإhere are no nurse with this data.")

    await user.update(req.body)

    SendResponseWithMessage(res, 200, "Nurse with id:" + id + " updated successfully")
})
)

//Delete nurse account
router.delete('/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {

    let id = req.params.id
    let user = await User.findOne({ where: { id, type: 'Nurse' } })
    if (!user)
        return SendResponseWithMessage(res, 404, "There are no nurse with this data.")

    await User.destroy({ where: { id } })
    SendResponseWithMessage(res, 200, "Nurse with id " + id + " deleted successfully")
})
)



module.exports = router