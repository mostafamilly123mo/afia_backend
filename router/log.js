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
let LogInfo = ['id', 'message', 'type', 'date', 'userId']
const { Op } = require("sequelize");

const router = express.Router()

//Get all logs 
router.get('/', Auth(['Admin']), TryCatch(async (req, res) => {

    let logs = await Log.findAll({
        attributes: LogInfo
    })
    if (logs.length == 0) return SendResponseWithMessage(res, 404, 'There are no logs.')

    SendResponse(res, 200, logs)
})
)

//Get all logs 
router.get('/date/:date', Auth(['Admin']), TryCatch(async (req, res) => {

    let date = req.params.date
    let logs = await Log.findAll({
        where: { date: { [Op.gte]: date } },
        attributes: LogInfo
    })
    if (logs.length == 0) return SendResponseWithMessage(res, 404, `There are no logs after this date ${date}.`)

    SendResponse(res, 200, logs)
})
)


module.exports = router