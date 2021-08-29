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

//Middlewares
//Authentication
const Auth = require('../middleware/Authentication/Auth')

//Upload Photos To Node JS Server 
//const upload = require('../middleware/PhotosUpload/ToNodeServer/Upload');
//let UploadPhotos = upload('uploads/SessionsPhotos', /\.(jpg|jpeg|PNG|png)$/).array('Photos', 3)

//Upload Photos To Cloudinary 
const upload = require('../middleware/PhotosUpload/ToCloudinary/multer');
const Cloudinary = require('../middleware/PhotosUpload/ToCloudinary/Cloudinary')
Cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Helper Function
const { getDoctorID, getPatientID, appointmentIdValidation } = require('../utilities/AppointmentHelperFunction')
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')

//Var 
let UserInfo = ['id', 'username', 'email', 'type']
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber',
    'description', 'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let SessionInfo = ['id', 'medicine', 'doctorReport']
let PhotoInfo = ['id', 'originalname', 'url', 'sessionId', 'categoryId']

const router = express.Router()

//Create session by appointment id
router.post('/appointmentId/:id', Auth(['Doctor']), appointmentIdValidation, upload(/\.(jpg|jpeg|PNG|png)$/).array('Photos', 3), TryCatch(async (req, res) => {
    let user = req.user
    let appointmentId = req.params.id
    let appointment = await Appointment.findByPk(appointmentId)

    const { error } = Session.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)
    //return res.status(400).json({ ErrorMessage: error.details[0].message })

    let session = new Session(req.body)
    let photos = new Array();

    let doctorId = await getDoctorID(user)
    await session.save()
    appointment.sessionId = session.id
    appointment.status = 'Done'
    appointment.save()

    if (req.files) {
        for (let index = 0; index < req.files.length; index++) {
            let photo = new Photo(req.files[index])
            const uploadResult = await Cloudinary.uploader.upload(req.files[index].path, {
                folder: 'SessionsPhotos',
                public_id: req.files.filename
            });
            photo.url = uploadResult.secure_url
            photo.public_id = uploadResult.public_id
            photo.width = uploadResult.width
            photo.height = uploadResult.height
            photo.uploaderId = doctorId
            photo.uploaderType = user.type
            photo.sessionId = session.id
            await photo.save()
            photos.push(photo.getPublicData())
        }
    }
    let sessionData = new Object()
    sessionData.session = session.getPublicData()
    sessionData.photos = photos

    //res.status(201).json(sessionData)
    SendResponse(res, 201, sessionData)
})
)

//Get session by appointment id
router.get('/appointmentId/:id', Auth(['Patient', 'Doctor', 'Nurse']), TryCatch(async (req, res) => {

    let id = req.params.id
    let user = req.user
    let QueryObject = new Object()

    if (user.type === 'Nurse') {
        QueryObject = { id }
    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        QueryObject = { id, doctorId }
    } else {
        let patientId = await getPatientID(user)
        QueryObject = { id, patientId }
    }

    let appointment = await Appointment.findOne({
        where: QueryObject
    })

    if (!appointment)
        return SendResponseWithMessage(res, 404, "Please ckeck appointment id is correct.")

    if (!appointment.sessionId)
        return SendResponseWithMessage(res, 404, "There is no session for this appointment.")

    let sessionId = appointment.sessionId
    let session = await Session.findOne({
        where: { id: sessionId },
        attributes: SessionInfo
    })

    let photos = await Photo.findAll({
        where: { sessionId },
        attributes: PhotoInfo
    })
    let data = new Object()
    data.session = session.getPublicData()
    data.photos = photos

    SendResponse(res, 200, data)
})
)

module.exports = router