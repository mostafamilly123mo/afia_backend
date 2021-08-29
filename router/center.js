const express = require('express')

//Loading Models 
let db = require("../models");
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
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')
const f = require('../utilities/WorkingDaysAnalyze')

//Var
let CenterDayInfo = ['id', 'day', 'openTime', 'closeTime', 'isOpen']
let CenterHolidayInfo = ['id', 'day', 'date']

const router = express.Router()

//Configuration Auth in this file

//Center Working Days In General ,Here We Will Add Data To Center Days Table 

//Create center work day :Admin:Done
router.post('/work_days', Auth(['Admin']), TryCatch(async (req, res) => {

    const { error } = CenterDay.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)
    let centerDay = new CenterDay(req.body)
    await centerDay.save()

    //To update working day table.
    await f();

    SendResponse(res, 201, centerDay.getPublicData())
})
)

//Get all center work day 
router.get('/work_days', TryCatch(async (req, res) => {
    let centerDays = await CenterDay.findAll({
        attributes: CenterDayInfo
    })
    if (centerDays.length == 0)
        return SendResponseWithMessage(res, 404, 'There are not center work days')
    SendResponse(res, 200, centerDays)

})
)

//Get specific center work day 
router.get('/work_days/day/:day', TryCatch(async (req, res) => {
    let day = req.params.day
    //try {
    let centerDay = await CenterDay.findAll({
        where: { day },
        attributes: CenterDayInfo
    })
    if (!centerDay)
        return SendResponseWithMessage(res, 404, 'There are not center work day')
    //return res.status(404).json({ Message: 'There are not center work day' })
    SendResponse(res, 200, centerDay)
    //res.status(200).json(centerDay)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.errors[0].message })

    // }
})
)

//Update time in center work day :Admin 
router.patch('/work_days/day/:day', Auth(['Admin']), TryCatch(async (req, res) => {
    let day = req.params.day
    //try {
    let updates = Object.keys(req.body)
    let NotAllowedUpdatesInDoctor = ['day']
    let isValid = updates.every((update) => !NotAllowedUpdatesInDoctor.includes(update))
    if (!isValid)
        return SendResponseWithMessage(res, 400, 'Invalid updates!')
    let isFound = await CenterDay.findOne({ where: { day } })
    if (isFound) {
        let affectedRows = await CenterDay.update(req.body, {
            where: { day },
            returning: true,
            plain: true
        })
        if (affectedRows[1] == 0)
            return SendResponseWithMessage(res, 403, 'An error occur when updating center day.')
        //return res.status(403).json({ Message: 'An error occur when updating center day.' })
        else
            SendResponseWithMessage(res, 200, `${day} was updated.`)
        //res.status(200).json({ UpdateResult: `${day} was updated.` })
    }
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.errors[0].message })
    // }
})
)

//Delete specific center work day 
//Here you need to detete all recourd from doctor days to detete form center day 
//need tessssssssssst 
router.delete('/work_days/day/:day', Auth(['Admin']), TryCatch(async (req, res) => {
    let day = req.params.day
    //try {
    let isFound = await CenterDay.findOne({ where: { day } })
    if (isFound) {
        let doctorDayAffectedRows = await DoctorDay.destroy({
            where: { day }
        })
        let centerDayAffectedRows = await CenterDay.destroy({
            where: { day }
        })

        //To update working day table.
        await f();

        if (centerDayAffectedRows == 0)
            return SendResponseWithMessage(res, 403, 'An error occur when deleting center day')
        else
            return SendResponseWithMessage(res, 200, `${day} was deleted from center working days`)
    } else
        SendResponseWithMessage(res, 404, `${day} is not center work day`)

})
)

//Adding Center Day Holidays, Here We Will Add Data To Center Holidays Table

//Create Holiday >>>
router.post('/holidays', Auth(['Admin']), TryCatch(async (req, res) => {

    const { error } = CenterHoliday.validate(req.body)
    if (error) return res.status(400).json({ ErrorMessage: error.details[0].message })
    let holiday = new CenterHoliday(req.body)

    //  try {
    await holiday.save()
    let affected = await WorkingDay.destroy({ where: { date: holiday.date } })

    //To update working day table.
    await f();

    SendResponse(res, 201, holiday.getPublicData())
    //res.status(201).json(holiday.getPublicData())
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
}))

//Get all center holiday 
router.get('/holidays', TryCatch(async (req, res) => {
    // try {
    let holidays = await CenterHoliday.findAll({
        attributes: CenterHolidayInfo
    })
    if (holidays.length == 0)
        return SendResponseWithMessage(res, 404, 'No center holidays')
    //return res.status(404).json({ Message: 'No center holidays' })
    //res.status(200).json(holidays)
    SendResponse(res, 200, holidays)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//Update holiday by id 
router.patch('/holidays/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {
    let id = req.params.id
    //try {
    let affectedRows = await CenterHoliday.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })
    if (affectedRows[1] == 0)
        return SendResponseWithMessage(res, 403, 'An error occur when updateing center day')
    //return res.status(403).json({ Message: 'An error occur when updateing center day' })
    else
        SendResponseWithMessage(res, 200, `Update Done`)
    //res.status(200).json({ UpdateResult: `Update Done` })

    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)
//add more route 
module.exports = router



/*
//Old Way
//Make one day a holiday :Admin :Done
//Maybe need to ckeck input
router.patch('/holiday/day/:day/state/:state', Auth(['Admin']), async(req, res) => {
    let day = req.params.day
    let state = req.params.state
    console.log(state)

    try {
        let centerDay = await CenterDay.findOne({ where: { day } })
        centerDay.isOpen = state
        await centerDay.save()
        if (centerDay.isOpen == true)
            res.status(200).json({ Message: `The center open in ${ day }` })
        else
            res.status(200).json({ Message: `The center closed in ${ day }` })

    } catch (e) {
        res.status(403).json({ ErrorMessage: e })
    }

})
*/