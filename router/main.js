const express = require('express')
const jwt = require('jsonwebtoken');

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
let Auth = require('../middleware/Authentication/Auth')

//Classes
let { DoctorObj, PatientObj } = require('../utilities/Classes')

//Helper Function
const TryCatch = require('../middleware/Error/TryCatch')
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
let pushNotification = require('../utilities/PushNotification')


//Var 
let UserInfo = ['id', 'username', 'email', 'type']
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber', 'description',
    'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let DoctorPhotoInfo = ['id', 'originalname', 'url', 'doctorId', 'categoryId']
let PatientPhotoInfo = ['id', 'originalname', 'url', 'patientId', 'categoryId']
let TagInfo = ['id', 'check', 'review', 'consultation', 'doctorId']


// const USERS = require('../shared/users');
// const CLINICS = require('../shared/clinics');
// const PATIENTS = require('../shared/patients');
// const DOCTORS = require('../shared/doctors');
// const APPOINTMENTS = require('../shared/appointments')


const router = express.Router()

//Post :Signin for all 
router.post('/Signin', TryCatch(async (req, res) => {

    let user = await User.findByCredentials(req.body.username, req.body.password)
    let token = User.generateAuthJWT(user)
    res.setHeader('Access-Control-Expose-Headers', "x-token")

    if (user.type === 'Admin') {
        let adminData = await User.findOne({
            where: { id: user.id },
            attributes: UserInfo
        })
        res.header('x-token', 'Bearer ' + token).status(200).json(adminData)
    } else if (user.type === 'Doctor') {
        const doctorData = await Doctor.findOne({
            where: { userId: user.id },
            attributes: DoctorInfo,
            include: [{ model: User, attributes: UserInfo }]
        })
        let photo = await Photo.findOne({
            where: { doctorId: doctorData.id },
            attributes: DoctorPhotoInfo
        })
        let tag = await Tag.findOne({
            where: { doctorId: doctorData.id },
            attributes: TagInfo
        })

        let doctor = new DoctorObj(doctorData, tag, photo)
        let message = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            contents: { "en": "From Boss" },
            headings: { "en": "Hi, Hmhm" },
            included_segments: ["All"]
        };

        let message2 = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            contents: { "en": "abd" },
            headings: { "en": "abd" },
            filters: [
                {
                    "field": "tag",
                    "key": "afiaId",
                    "relation": "=",
                    "value": "55100555"
                },
            ]
        };
        pushNotification(message2);
        res.header('x-token', 'Bearer ' + token).status(200).json(doctor)
    } else if (user.type === 'Patient') {
        const patientData = await Patient.findOne({
            where: { userId: user.id },
            attributes: PatientInfo,
            include: [{ model: User, attributes: UserInfo }]
        })
        let photo = await Photo.findOne({
            where: { patientId: patientData.id },
            attributes: PatientPhotoInfo
        })
        let patient = new PatientObj(patientData, photo)
        let message2 = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            contents: { "en": "abd" },
            headings: { "en": "abd" },
            filters: [
                {
                    "field": "tag",
                    "key": "afiaId",
                    "relation": "=",
                    "value": "55555"
                },
            ]
        };
        pushNotification(message2);
        res.header('x-token', 'Bearer ' + token).status(200).json(patient)
    } else
        res.header('x-token', 'Bearer ' + token).status(200).json(user.getPublicProfile())
})
)

//Get :Profile for all 
router.get('/Me', Auth(['Admin', 'Doctor', 'Patient', 'Nurse']), TryCatch(async (req, res) => {
    const user = req.user
    //try {
    if (user.type === 'Admin') {
        const admin = await Doctor.findOne({
            where: { userId: user.id },
            attributes: DoctorInfo,
            include: [{ model: User, attributes: UserInfo }]
        })
        SendResponse(res, 200, admin)
    } else if (user.type === 'Doctor') {
        const doctorData = await Doctor.findOne({
            where: { userId: user.id },
            attributes: DoctorInfo,
            include: [{ model: User, attributes: UserInfo }]
        })
        let photo = await Photo.findOne({
            where: { doctorId: doctorData.id },
            attributes: DoctorPhotoInfo
        })
        let tag = await Tag.findOne({
            where: { doctorId: doctorData.id },
            attributes: TagInfo
        })

        let doctor = new DoctorObj(doctorData, tag, photo)
        SendResponse(res, 200, doctor)
    } else if (user.type === 'Patient') {
        const patientData = await Patient.findOne({
            where: { userId: user.id },
            attributes: PatientInfo,
            include: [{ model: User, attributes: UserInfo }]
        })
        let photo = await Photo.findOne({
            where: { patientId: patientData.id },
            attributes: PatientPhotoInfo
        })
        let patient = new PatientObj(patientData, photo)
        SendResponse(res, 200, patient)
    } else
        SendResponse(res, 200, user.getPublicProfile())
})
)


//From stev

router.get('/addMockData', async (req, res) => {
    try {
        for (userData of USERS) {
            let user = new User(userData)
            user.save()
        }
        for (clinicData of CLINICS) {
            let clinic = new Clinic(clinicData)
            clinic.save()
        }
        for (patientData of PATIENTS) {
            let patient = new Patient(patientData)
            patient.save()
        }
        for (doctorData of DOCTORS) {
            let doctor = new Doctor(doctorData)
            doctor.save()
        }
        for (appoinmentData of APPOINTMENTS) {
            let appointment = new Appointment(appoinmentData)
            appointment.save()
        }
        res.status(200).json({ success: true })
    }
    catch (e) {
        console.log(e)
        res.status(404).send({ error: e })
    }
})

router.get('/autoLogin', async (req, res) => {
    try {
        const tempToken = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(tempToken, 'clinic')
        const user = await User.findOne({
            where: { username: decoded.username }
        })
        if (!user) res.status(404).json({ messege: "failed to login" })

        let token = User.generateAuthJWT(user)
        res.setHeader('Access-Control-Expose-Headers', "x-token")
        if (user.type === 'Admin') {
            let adminData = await User.findOne({
                where: { id: user.id },
                attributes: UserInfo
            })
            res.header('x-token', 'Bearer ' + token).status(200).json(adminData)
        } else if (user.type === 'Doctor') {
            const doctorData = await Doctor.findOne({
                where: { userId: user.id },
                attributes: DoctorInfo,
                include: [{ model: User, attributes: UserInfo }]
            })
            let photo = await Photo.findOne({
                where: { doctorId: doctorData.id },
                attributes: DoctorPhotoInfo
            })
            let tag = await Tag.findOne({
                where: { doctorId: doctorData.id },
                attributes: TagInfo
            })
            let doctor = new DoctorObj(doctorData, tag, photo)
            res.header('x-token', 'Bearer ' + token).status(200).json(doctor)
        }
        else if (user.type === 'Patient') {
            const patientData = await Patient.findOne({
                where: { userId: user.id },
                attributes: PatientInfo,
                include: [{ model: User, attributes: UserInfo }]
            })
            let photo = await Photo.findOne({
                where: { patientId: patientData.id },
                attributes: PatientPhotoInfo
            })
            let patient = new PatientObj(patientData, photo)

            res.header('x-token', 'Bearer ' + token).status(200).json(patient)
        } else
            res.header('x-token', 'Bearer ' + token).status(200).json(user.getPublicProfile())
    } catch (e) {
        res.status(403).send({ ErrorMessage: e.message })
    }
})

router.post('/checkUserName', Auth(['Nurse', 'Admin']), async (req, res) => {
    const username = req.body.username
    try {
        const user = await User.findOne({
            where: { username: username }
        })
        if (!user) {
            res.status(200).json({ messege: "username is valid" })
        }
        else {
            res.status(404).json({ messege: "username is not valid" })
        }
    }
    catch (e) {
        res.status(422).json({ messege: e })
    }
})

router.post('/checkEmail', Auth(['Nurse', 'Admin']), async (req, res) => {
    const email = req.body.email
    try {
        const user = await User.findOne({
            where: { email: email }
        })
        if (!user) {
            res.status(200).json({ messege: "email is valid" })
        }
        else {
            res.status(422).json({ messege: "email is not valid" })
        }
    }
    catch (e) {
        res.status(404).json({ messege: e })
    }
})

module.exports = router



/*
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
router.post('/Signup', async(req, res) => {
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

//Post :Logout for all
router.post('/Logout', Auth(['Admin', 'Doctor', 'Patient', 'Nurse']), async (req, res) => {
    const user = req.user
    try {
        user.token = ''
        await user.save()
        res.status(200).json('Logout Done.')
    } catch (e) {
        res.status(403).send('error : ' + e)
    }
})

*/