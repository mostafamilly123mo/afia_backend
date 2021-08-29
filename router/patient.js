const express = require('express')
const fs = require('fs')
const ejs = require('ejs')
let pdf = require("html-pdf");
let path = require('path')
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


//Middlewares
//Authentication
let Auth = require('../middleware/Authentication/Auth')

//Upload Photos To Node JS Server 
//const upload = require('../middleware/PhotosUpload/ToNodeServer/Upload');
//let UploadPhotos = upload('uploads/ConsultationsPhotos', /\.(jpg|jpeg|PNG|png)$/).array('Photos', 3)

//Upload Photos To Cloudinary 
const upload = require('../middleware/PhotosUpload/ToCloudinary/multer');
const Cloudinary = require('../middleware/PhotosUpload/ToCloudinary/Cloudinary')
Cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Classes
let { PatientObj } = require('../utilities/Classes')
let { MedicineInSessions } = require('../utilities/Classes')

//Helper Function
const { getPatientID } = require('../utilities/AppointmentHelperFunction');
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')
let { LogToDataBase } = require('../utilities/LogToDataBase')

//Var 
const { Op } = require("sequelize");
let UserInfo = ['id', 'username', 'email']
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address', 'phone', 'number',
    'gender', 'length', 'weight', 'birthday']
let PhotoInfo = ['id', 'originalname', 'url', 'patientId', 'categoryId']
let MedicinesInfo = ['medicine']


const router = express.Router()


//Post :Create patient account by Nurse  
router.post('/Signup', Auth(['Nurse']), TryCatch(async (req, res) => {

    let userValidate = User.validate(req.body.user)
    if (userValidate.error)
        return SendResponseWithMessage(res, 400, userValidate.error.details[0].message)
    let user = new User(req.body.user)

    let patientValidate = Patient.validate(req.body)
    if (patientValidate.error)
        return SendResponseWithMessage(res, 400, patientValidate.error.details[0].message)
    let patient = new Patient(req.body)

    await user.save()
    let token = User.generateAuthJWT(user)
    patient.userId = user.id
    await patient.save()
    //Log to database for nurse
    let TodayDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    let Today = moment(TodayDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    let message = `A user has id ${user.id} created patient account `
    await LogToDataBase(message, Today, user.type, user.id)

    res.setHeader('Access-Control-Expose-Headers', "x-token")
    res.header('x-token', 'Bearer ' + token).status(201).json({ PatientData: patient.getPublicProfile(), MainData: user.getPublicProfile() })
})
)

//Create Report info for patient
router.post('/info_report', Auth(['Nurse']), TryCatch(async (req, res) => {

    let reportData = req.body
    ejs.renderFile(path.join(__dirname, '../utilities/', 'PatientProfile.ejs'),
        { patient: req.body }, (error, data) => {
            if (error) {
                console.log(error)
                return SendResponse(res, 422, error.message)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${reportData.user.username}-Info.pdf`, function (err, data) {
                    if (err) {
                        return SendResponse(res, 422, error)
                    }
                    else {
                        let reportPath = `${__dirname}uploads/Reports/${reportData.user.username}-Info.pdf`

                        //SendResponse(res, 200, {reportPath})
                        console.log(`${__dirname}uploads/Reports/${reportData.user.username}-Info.pdf`)
                        res.download(`uploads/Reports/${reportData.user.username}-Info.pdf`)
                    }
                })
            }
        })

})
)

//Update patient Profile (Patient) 
router.patch('/profile', Auth(['Patient']), TryCatch(async (req, res) => {

    let updates = Object.keys(req.body)
    let NotAllowedUpdatesInPatient = ['userId']
    let isValid = updates.every((update) => !NotAllowedUpdatesInPatient.includes(update))
    if (!isValid) return res.status(400).json({ ErrorMessage: 'Invalid updates!' })

    updates = Object.keys(req.body.user)
    let NotAllowedUpdatesInUser = ['username', 'password', 'type']
    isValid = updates.every((update) => !NotAllowedUpdatesInUser.includes(update))
    if (!isValid) return SendResponseWithMessage(res, 400, 'Invalid updates')

    let user = req.user
    let id = await getPatientID(user)
    const patientUpdated = await Patient.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })

    await user.update(req.body.user)

    let newPatientData = await Patient.findOne({
        where: { id },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!newPatientData)
        return SendResponseWithMessage(res, 404, 'No patient with this id')

    //Log to database for patient
    let TodayDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    let Today = moment(TodayDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    let message = `${newPatientData.firstName} ${newPatientData.lastName} updated his account `
    await LogToDataBase(message, Today, user.type, user.id)

    let photo = await Photo.findOne({
        where: { patientId: newPatientData.id },
        attributes: PhotoInfo
    })
    let patient = new PatientObj(newPatientData, photo)
    SendResponse(res, 200, patient)
})
)

//Update patient Profile (Nures) 
router.patch('/profile/id/:patientId', Auth(['Nurse']), TryCatch(async (req, res) => {

    let id = req.params.patientId
    let patient = await Patient.findOne({ where: { id } })
    if (!patient) return SendResponseWithMessage(res, 404, 'Patient profile not found.')
    let user = await User.findOne({ where: { id: patient.userId } })

    let updates = Object.keys(req.body)
    let NotAllowedUpdatesInPatient = ['userId']
    let isValid = updates.every((update) => !NotAllowedUpdatesInPatient.includes(update))
    if (!isValid) return res.status(400).json({ ErrorMessage: 'Invalid updates!' })

    updates = Object.keys(req.body.user)
    let NotAllowedUpdatesInUser = ['type']
    isValid = updates.every((update) => !NotAllowedUpdatesInUser.includes(update))
    if (!isValid) return SendResponseWithMessage(res, 400, 'Invalid updates')

    const patientUpdated = await Patient.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })

    await user.update(req.body.user)
    //Log to database for patient
    let TodayDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    let Today = moment(TodayDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
    let message = `Nurse has updated patient account and the patientId is ${id}`
    await LogToDataBase(message, Today, user.type, user.id)

    SendResponseWithMessage(res, 200, 'Patient data updated.!')
})
)

//Get all patient use by Nurse and Admin
router.get('/all', TryCatch(async (req, res) => {
    let patients = new Array()

    let allPatients = await Patient.findAll({
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    for (let index = 0; index < allPatients.length; index++) {
        let photo = await Photo.findOne({
            where: { patientId: allPatients[index].id },
            attributes: PhotoInfo
        })
        let patient = new PatientObj(allPatients[index], photo)
        patients.push(patient)
    }
    SendResponse(res, 200, patients)
})
)

//Get patient by Id 
router.get('/id/:id', TryCatch(async (req, res) => {
    let id = req.params.id
    //try {
    let patientData = await Patient.findOne({
        where: { id },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        return SendResponseWithMessage(res, 404, 'No patient with this id')
    //return res.status(404).json({ ErrorMessage: 'No patient with this id' })
    let photo = await Photo.findOne({
        where: { patientId: patientData.id },
        attributes: PhotoInfo
    })
    let patient = new PatientObj(patientData, photo)
    SendResponse(res, 200, patient)
    //res.status(200).json(patient)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)

//Check patient is already existing by username
router.post('/username/:username', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let username = req.params.username

    let user = await User.findOne({ where: { username } })
    if (!user || user.type != 'Patient')
        return SendResponseWithMessage(res, 404, 'Invalid username')
    // {
    //     res.statusMessage = 'Invalid username'
    //     res.status(404).end()
    // }
    let patient = await Patient.findOne({ where: { userId: user.id } })
    SendResponse(res, 200, { patientId: patient.id })
    //res.status(200).json({ patientId: patient.id })
})
)

//Get Last Medicines
router.get('/medicines/id/:patientId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    let patientId = req.params.patientId
    let Medicines = new Array()
    let patientMedicines = await Appointment.findAll({
        where: { patientId: patientId, sessionId: { [Op.ne]: null } },
        attributes: ['id'],
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Session, attributes: MedicinesInfo }]
    })

    for (let index = 0; index < patientMedicines.length; index++) {
        let Medicine = new MedicineInSessions(patientMedicines[index].session.medicine)
        Medicines.push(Medicine)
    }
    if (Medicines.length === 0) {
        return SendResponseWithMessage(res, 404, "There are no medcines for this patient in last 5 sessions.")
    }
    SendResponse(res, 200, Medicines)
})
)

//Here:Patient Photo Routers 

//Add patient photo
router.post('/photo', Auth(['Patient']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let patientId = await getPatientID(user)
    if (!req.file) {
        return SendResponseWithMessage(res, 403, "Please upload a profile photo!")
        //res.status(403).json({ message: "Please upload a profile photo!" })
    } else {
        let isHavePhoto = await Photo.findOne({ where: { patientId } })
        if (isHavePhoto != null)
            return SendResponseWithMessage(res, 403, 'You already have photo.')
        // return res.status(403).json({ Message: 'You already have photo.' })
        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'PatientsPhotos',
            public_id: req.file.filename
        });
        const photo = new Photo(req.file)
        photo.url = uploadResult.secure_url
        photo.public_id = uploadResult.public_id
        photo.width = uploadResult.width
        photo.height = uploadResult.height
        photo.uploaderId = patientId
        photo.uploaderType = 'Patient'
        photo.patientId = patientId
        await photo.save()
        SendResponse(res, 201, photo.getPublicData())
        // res.status(201).json(photo.getPublicData())
    }
    // } catch (err) {
    //     res.status(500).json({ message: `Could not upload the file: . ${err}` });
    // }
})
)

//Get my(Patient) photo
router.get('/photo', Auth(['Patient']), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let patientId = await getPatientID(user)
    let patientPhoto = await Photo.findOne({
        where: { patientId },
        attributes: PhotoInfo
    })
    if (!patientPhoto)
        return SendResponseWithMessage(res, 404, 'Do not have a photo.')
    //return res.status(404).json({ Message: `Do not have a photo.` })
    //res.status(200).json(patientPhoto)

    SendResponse(res, 200, patientPhoto)
    // } catch (e) {
    //     res.status(500).json({ message: ` ${e}`, });
    // }
})
)

//Get Patient photo by id 
router.get('/photo/id/:patientId', TryCatch(async (req, res) => {
    const patientId = req.params.patientId
    //try {
    const patientPhoto = await Photo.findAll({
        where: { patientId },
        attributes: PhotoInfo
    })
    if (!patientPhoto) return SendResponseWithMessage(res, 404, 'Do not have a photo.')

    //return res.status(404).json({ Message: `Do not have a photo.` })
    SendResponse(res, 200, patientPhoto)

    //    res.status(200).json(patientPhoto)

    // } catch (e) {
    //     res.status(500).json({ message: ` ${e}`, });
    // }
})
)

//Update Patient photo 
router.patch('/photo', Auth(['Patient']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let patientId = await getPatientID(user)
    if (!req.file) {
        return SendResponseWithMessage(res, 403, "Please upload a profile photo!")
        //res.status(403).json({ message: "Please upload a profile photo!" })
    } else {
        const patientPhoto = await Photo.findOne({ where: { patientId } })
        await Cloudinary.uploader.destroy(patientPhoto.public_id)

        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'PatientsPhotos',
            public_id: req.file.filename
        });
        const updateData = {
            originalname: req.file.originalname,
            filename: req.file.filename,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height
        }
        const affectedRows = await Photo.update(updateData, {
            where: { patientId },
            returning: true,
            plain: true
        })
        if (affectedRows[1] > 0) {
            let newPhoto = await Photo.findOne({
                where: { patientId },
                attributes: PhotoInfo
            })
            return SendResponse(res, 200, newPhoto)
        }

        SendResponseWithMessage(res, 403, `Update operation failed`)
    }
    // } catch (err) {
    //     res.status(500).json({ message: `Could not upload the file: . ${err}` });
    // }
})
)

//Delete Patient photo
router.delete('/photo', Auth(['Patient']), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let patientId = await getPatientID(user)
    const patientPhoto = await Photo.findOne({ where: { patientId } })

    if (patientPhoto.url) {
        await Cloudinary.uploader.destroy(patientPhoto.public_id)
    } else {
        SendResponseWithMessage(res, 403, "No photo to deleted")
        //res.status(403).json({ message: "No photo to deleted" })
    }

    const deletedPhoto = await Photo.destroy({ where: { patientId } })
    //res.status(200).json({ message: `Deleted ${deletedPhoto} file successfully ` })
    SendResponseWithMessage(res, 200, `Deleted ${deletedPhoto} file successfully `)
    // } catch (err) {
    //     res.status(500).send({ message: `Could not delete the photo: . ${err}` });
    // }
})
)


module.exports = router