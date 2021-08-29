const express = require('express')
const ejs = require('ejs')
let pdf = require("html-pdf");
let path = require('path')
const { Op } = require("sequelize");

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

//Classes
let { CustomSession } = require('../utilities/Classes')

//Helper Function
const TryCatch = require('../middleware/Error/TryCatch')
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const { getPatientID, getDoctorID } = require('../utilities/AppointmentHelperFunction')

//Var
let UserInfo = ['id', 'username', 'email']
let AppointmentInfo = ['id', 'day', 'date', 'startTime', 'endTime', 'type',
    'description', 'status', 'doctorId', 'patientId', 'sessionId', 'clinicId']
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber', 'description',
    'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address', 'phone', 'number',
    'gender', 'length', 'weight', 'birthday']
let SessionInfo = ['id', 'medicine', 'doctorReport']
let ClinicInfo = ['id', 'name']
let PhotoInfo = ['url']

const router = express.Router()

//Create report for patient
router.get('/', Auth(['Patient']), TryCatch(async (req, res) => {

    let user = req.user
    let patientId = await getPatientID(user)

    let patientData = await Patient.findOne({
        where: { id: patientId },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        return SendResponseWithMessage(res, 404, "Patient is not exist")

    let appointments = await Appointment.findAll({
        where: { patientId, status: 'Done', sessionId: { [Op.ne]: null } },
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }, {
            model: Clinic,
            attributes: ClinicInfo
        }]

    })

    // if (appointments.length == 0)
    //     return SendResponseWithMessage(res, 404, 'There are no appointments for you to generate report.')

    let Sessions = new Array()
    for (let index = 0; index < appointments.length; index++) {
        let doctorName = appointments[index].doctor.firstName + ' ' + appointments[index].doctor.lastName
        let clinic = appointments[index].clinic.name
        let date = appointments[index].date
        let type = appointments[index].type
        let description = appointments[index].description
        let medicine = appointments[index].session.medicine
        let doctorReport = appointments[index].session.doctorReport
        let photos = await Photo.findAll({
            where: { sessionId: appointments[index].sessionId },
            attributes: PhotoInfo
        })
        let sessionData = new CustomSession(doctorName, clinic, date, type,
            description, medicine, doctorReport, photos)

        Sessions.push(sessionData)
    }

    ejs.renderFile(path.join(__dirname, '../utilities/', 'report.ejs'),
        { patient: patientData, sessions: Sessions }, (error, data) => {
            if (error) {
                console.log(error)
                SendResponse(res, 422, error.message)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${patientData.user.username}-GeneralReport.pdf`, function (err, data) {
                    if (err) {
                        SendResponse(res, 422, error)
                    }
                    else {
                        let reportPath = `${__dirname}uploads/Reports/${patientData.user.username}-GeneralReport.pdf`
    
                        //SendResponse(res, 200, {reportPath})
                        console.log(`${__dirname}uploads/Reports/${patientData.user.username}-GeneralReport.pdf`)
                        res.download(`uploads/Reports/${patientData.user.username}-GeneralReport.pdf`)
                    }
                })
            }
        })

})
)

//Create report for patient with specific doctor
router.get('/id/:doctorId', Auth(['Patient']), TryCatch(async (req, res) => {

    let user = req.user
    let patientId = await getPatientID(user)
    let doctorId = req.params.doctorId

    let patientData = await Patient.findOne({
        where: { id: patientId },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        return SendResponseWithMessage(res, 404, "Patient is not exist")

    let appointments = await Appointment.findAll({
        where: { patientId, doctorId, status: 'Done', sessionId: { [Op.ne]: null } },
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }, {
            model: Clinic,
            attributes: ClinicInfo
        }]

    })

    // if (appointments.length == 0)
    //     return SendResponseWithMessage(res, 404, 'There are no appointment for you to generate report.')

    let Sessions = new Array()
    for (let index = 0; index < appointments.length; index++) {
        let doctorName = appointments[index].doctor.firstName + ' ' + appointments[index].doctor.lastName
        let clinic = appointments[index].clinic.name
        let date = appointments[index].date
        let type = appointments[index].type
        let description = appointments[index].description
        let medicine = appointments[index].session.medicine
        let doctorReport = appointments[index].session.doctorReport
        let photos = await Photo.findAll({
            where: { sessionId: appointments[index].sessionId },
            attributes: PhotoInfo
        })
        let sessionData = new CustomSession(doctorName, clinic, date, type,
            description, medicine, doctorReport, photos)

        Sessions.push(sessionData)
    }

    ejs.renderFile(path.join(__dirname, '../utilities/', 'report.ejs'),
        { patient: patientData, sessions: Sessions }, (error, data) => {
            if (error) {
                console.log(error)
                //SendResponse(res, 422, error)
                SendResponse(res, 422, error.message)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${patientData.user.username}-SpecificReport.pdf`, function (err, data) {
                    if (err) {
                        SendResponse(res, 422, error)
                    }
                    else {
                        res.download(`uploads/Reports/${patientData.user.username}-SpecificReport.pdf`)
                    }
                })
            }
        })

})
)

//Create report to patient
router.get('/patientId/:patientId', Auth(['Nurse']), TryCatch(async (req, res) => {

    let patientId = req.params.patientId

    let patientData = await Patient.findOne({
        where: { id: patientId },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        return SendResponseWithMessage(res, 404, "Patient is not exist")

    let appointments = await Appointment.findAll({
        where: { patientId, status: 'Done', sessionId: { [Op.ne]: null } },
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }, {
            model: Clinic,
            attributes: ClinicInfo
        }]

    })

    // if (appointments.length == 0)
    //     return SendResponseWithMessage(res, 404, 'There are no appointment for you to generate report.')

    let Sessions = new Array()
    for (let index = 0; index < appointments.length; index++) {
        let doctorName = appointments[index].doctor.firstName + ' ' + appointments[index].doctor.lastName
        let clinic = appointments[index].clinic.name
        let date = appointments[index].date
        let type = appointments[index].type
        let description = appointments[index].description
        let medicine = appointments[index].session.medicine
        let doctorReport = appointments[index].session.doctorReport
        let photos = await Photo.findAll({
            where: { sessionId: appointments[index].sessionId },
            attributes: PhotoInfo
        })
        let sessionData = new CustomSession(doctorName, clinic, date, type,
            description, medicine, doctorReport, photos)

        Sessions.push(sessionData)
    }

    ejs.renderFile(path.join(__dirname, '../utilities/', 'report.ejs'),
        { patient: patientData, sessions: Sessions }, (error, data) => {
            if (error) {
                console.log(error)
                SendResponse(res, 422, error.message)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${patientData.user.username}-GeneralReport.pdf`, function (err, data) {
                    if (err) {
                        SendResponse(res, 422, error)
                    }
                    else {
                        res.download(`uploads/Reports/${patientData.user.username}-GeneralReport.pdf`)
                    }
                })
            }
        })

})
)

//Create report for patient with specific doctor
router.get('/patientId/:patientId/doctorId/:doctorId', Auth(['Nurse']), TryCatch(async (req, res) => {

    let patientId = req.params.patientId
    let doctorId = req.params.doctorId

    let patientData = await Patient.findOne({
        where: { id: patientId },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        return SendResponseWithMessage(res, 404, "Patient is not exist")

    let appointments = await Appointment.findAll({
        where: { patientId, doctorId, status: 'Done', sessionId: { [Op.ne]: null } },
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }, {
            model: Clinic,
            attributes: ClinicInfo
        }]

    })

    // if (appointments.length == 0)
    //     return SendResponseWithMessage(res, 404, 'There are no appointment for you to generate report.')

    let Sessions = new Array()
    for (let index = 0; index < appointments.length; index++) {
        let doctorName = appointments[index].doctor.firstName + ' ' + appointments[index].doctor.lastName
        let clinic = appointments[index].clinic.name
        let date = appointments[index].date
        let type = appointments[index].type
        let description = appointments[index].description
        let medicine = appointments[index].session.medicine
        let doctorReport = appointments[index].session.doctorReport
        let photos = await Photo.findAll({
            where: { sessionId: appointments[index].sessionId },
            attributes: PhotoInfo
        })
        let sessionData = new CustomSession(doctorName, clinic, date, type,
            description, medicine, doctorReport, photos)

        Sessions.push(sessionData)
    }

    ejs.renderFile(path.join(__dirname, '../utilities/', 'report.ejs'),
        { patient: patientData, sessions: Sessions }, (error, data) => {
            if (error) {
                console.log(error)
                SendResponse(res, 422, error.message)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${patientData.user.username}-SpecificReport.pdf`, function (err, data) {
                    if (err) {
                        SendResponse(res, 422, error)
                    }
                    else {
                        res.download(`uploads/Reports/${patientData.user.username}-SpecificReport.pdf`)
                    }
                })
            }
        })

})
)

module.exports = router


/*
//Create report for patient
router.get('/id/:patientId', TryCatch(async (req, res) => {

    let patientId = req.params.patientId

    let patientData = await Patient.findOne({
        where: { id: patientId },
        attributes: PatientInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!patientData)
        SendResponseWithMessage(res, 404, "patient is not exist")

    let appointments = await Appointment.findAll({
        where: { patientId },
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }, {
            model: Clinic,
            attributes: ClinicInfo
        }]

    })
    let Sessions = new Array()

    for (let index = 0; index < appointments.length; index++) {
        let doctorName = appointments[index].doctor.firstName + ' ' + appointments[index].doctor.lastName
        let clinic = appointments[index].clinic.name
        let date = appointments[index].date
        let type = appointments[index].type
        let description = appointments[index].description
        let medicine = appointments[index].session.medicine
        let doctorReport = appointments[index].session.doctorReport
        let photos = await Photo.findAll({
            where: { sessionId: appointments[index].sessionId },
            attributes: PhotoInfo
        })
        let sessionData = new CustomSession(doctorName, clinic, date, type,
            description, medicine, doctorReport, photos)

        Sessions.push(sessionData)
    }

    ejs.renderFile(path.join(__dirname, '../utilities/', 'report.ejs'),
        { patient: patientData, sessions: Sessions }, (error, data) => {
            if (error) {
                console.log(error)
                SendResponse(res, 422, error)
            }
            else {
                let options = {
                    "format": "Letter",
                    "orientation": "portrait",
                }
                pdf.create(data, options).toFile(`uploads/Reports/${patientData.user.username}report.pdf`, function (err, data) {
                    if (err) {
                        SendResponse(res, 422, error)
                    }
                    else {
                        res.download(`uploads/Reports/${patientData.user.username}report.pdf`)
                    }
                })
            }
        })

})
)


*/