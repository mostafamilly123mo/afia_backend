const express = require('express')
const moment = require('moment');

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
const { getPatientID, getDoctorID } = require('../utilities/AppointmentHelperFunction')
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')

//Var
let Reviewinfo = ['id', 'message', 'date', 'readed', 'patientId']

const router = express.Router()

//Create new review 
router.post('/', Auth(['Patient']), TryCatch(async (req, res) => {

    let user = req.user
    let patientId = await getPatientID(user)
    let date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    let now = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD');

    let reviewValidate = Review.validate(req.body)
    if (reviewValidate.error)
        return SendResponseWithMessage(res, 400, reviewValidate.error.details[0].message)

    let review = new Review(req.body)
    review.patientId = patientId
    review.date = now
    await review.save()
    SendResponse(res, 201, review.getPublicData())

})
)

//Get all reviews
router.get('/', Auth(['Admin']), TryCatch(async (req, res) => {

    let reviews = await Review.findAll({ attributes: Reviewinfo , include : Patient })

    if (reviews.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no reviews.')

    SendResponse(res, 200, reviews)
})
)

//Get all readed reviews
router.get('/readed', Auth(['Admin']), TryCatch(async (req, res) => {

    let reviews = await Review.findAll({
        where: { readed: true },
        attributes: Reviewinfo,
        include : Patient
    })

    if (reviews.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no readed reviews.')

    SendResponse(res, 200, reviews)
})
)

//Get all un readed reviews
router.get('/un_readed', Auth(['Admin']), TryCatch(async (req, res) => {

    let reviews = await Review.findAll({
        where: { readed: false },
        attributes: Reviewinfo,
        include : Patient
    })
    if (reviews.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no un readed reviews.')

    SendResponse(res, 200, reviews)
})
)

//Get all reviews for specific patient
router.get('/patient/id/:patientId', Auth(['Admin']), TryCatch(async (req, res) => {

    let patientId = req.params.patientId

    let reviews = await Review.findAll({
        where: { patientId },
        attributes: Reviewinfo
    })
    if (reviews.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no reviews for this patient.')

    SendResponse(res, 200, reviews)
})
)

//Get my reviews 
router.get('/my_reviews', Auth(['Patient']), TryCatch(async (req, res) => {

    let user = req.user
    let patientId = await getPatientID(user)
    let myReviews = await Review.findAll({
        where: { patientId },
        attributes: Reviewinfo
    })
    if (myReviews.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no reviews for you.')
    SendResponse(res, 200, myReviews)
})
)

//Mark review as readed 
router.patch('/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {

    let id = req.params.id
    let isFound = await Review.findOne({ where: { id } })
    if (!isFound) return SendResponseWithMessage(res, 404, 'There no review has this id.')

    let updatedRow = await Review.update({ readed: req.body.readed }, {
        where: { id },
        returning: true,
        plain: true
    })

    let updatedReview = await Review.findOne({
        where: { id },
        attributes: Reviewinfo
    })

    SendResponse(res, 200, updatedReview)
})
)

//Delete review 
router.delete('/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {

    let id = req.params.id
    let isFound = await Review.findOne({ where: { id } })
    if (!isFound) return SendResponseWithMessage(res, 404, 'There no review has this id.')

    let deletedRow = await Review.destroy({ where: { id } })

    if (deletedRow == 0)
        return SendResponseWithMessage(res, 403, 'An error occurred when deleting review.')

    SendResponseWithMessage(res, 200, 'Delete operation done.')
}))


module.exports = router