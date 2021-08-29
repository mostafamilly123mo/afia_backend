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
let AdminInfo = ['id', 'email', 'username', 'type']

const router = express.Router()

//Post :Create nurse account by admin 
router.post('/Signup', Auth(['Admin']), TryCatch(async (req, res) => {

    const { error } = User.validate(req.body)
    if (error) return SendResponseWithMessage(res, 400, error.details[0].message)

    let user = new User(req.body)
    await user.save()
    let token = User.generateAuthJWT(user)
    res.setHeader('Access-Control-Expose-Headers', "x-token")
    res.header('x-token', 'Bearer ' + token).status(201).json({ AdminData: user.getPublicProfile() })
})
)

//Maybe need to deleted
//Get all admins 
router.get('/', Auth(['Admin']), TryCatch(async (req, res) => {
    let admins = await User.findAll({
        where: { type: 'Admin' },
        attributes: AdminInfo
    })
    if (admins.length === 0)
        return SendResponseWithMessage(res, 404, "There are no admins.")

    return SendResponse(res, 200, admins)
})
)


module.exports = router