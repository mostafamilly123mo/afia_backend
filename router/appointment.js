const express = require('express')
const moment = require('moment');

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
let { FullAppointmentObj } = require('../utilities/Classes')

//Helper Function
let { getPatientID, getDoctorID, filterAppointment,
    updateAppointment, deleteAppointment } = require('../utilities/AppointmentHelperFunction')
let { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')
let ReservedAppointment = require('../utilities/reservedAppointment')
let { getAppointmentAfterSpecificTime, unReservedTimeInPeriod } = require('../utilities/UnReservedTime')
let getDayByDate = require('../utilities/GenerateDatesAndDays')
let pushNotification = require('../utilities/PushNotification')
let { LogToDataBase } = require('../utilities/LogToDataBase')

//Var
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber',
    'description', 'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let PatientMainInfo = ['id', 'firstName', 'lastName', 'birthday']
let AppointmentInfo = ['id', 'day', 'date', 'startTime', 'endTime', 'type',
    'description', 'status', 'doctorId', 'patientId', 'sessionId', 'clinicId']
let SessionInfo = ['id', 'medicine', 'doctorReport']
let PhotoInfo = ['id', 'originalname', 'url', 'categoryId']
let TodayDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
let Today = moment(TodayDate, 'YYYY-MM-DD').format('YYYY-MM-DD');


const { Op } = require("sequelize");


const router = express.Router()

//Create new appointment use by: patient and nurse :Done
router.post('/', Auth(['Nurse', 'Patient']), TryCatch(async (req, res) => {

    let user = req.user
    const { error } = Appointment.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)
    let appointment = new Appointment(req.body);

    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        appointment.patientId = patientId
        //Log to database for patient
        let patient = await Patient.findByPk(patientId)
        let message = `${patient.firstName} ${patient.lastName} create new appointment`
        await LogToDataBase(message, Today, user.type, user.id)

    } else if (user.type === 'Nurse') {
        //Log to database for nurse
        let nurse = await User.findByPk(user.id)
        let patient = await Patient.findByPk(req.body.patientId)
        let message = `A nurse ${nurse.username} create new appointment to ${patient.firstName} ${patient.lastName} and patientId is ${patient.id}`
        await LogToDataBase(message, Today, user.type, user.id)

    }
    await appointment.save()
    SendResponse(res, 200, appointment.getPublicProfile())
})
)

//Get all appointment for specific patient use by: patient :Done
router.get('/', Auth(['Patient']), TryCatch(async (req, res) => {
    let user = req.user
    let patientId = await getPatientID(user)
    let PatientQueryObj = { patientId }
    let appointments = await filterAppointment(PatientQueryObj)
    SendResponse(res, 200, appointments)

}))

//Get all appointment for specific patient  use by: nurse :Done
router.get('/patientId/:patientId', Auth(['Nurse']), TryCatch(async (req, res) => {
    let patientId = req.params.patientId
    let QueryObj = { patientId }

    let appointments = await filterAppointment(QueryObj)
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There is no appointment')

    SendResponse(res, 200, appointments)
})
)

//Get all appointment in specific day use by patient and nurse :Done
router.get('/day/:day', Auth(['Nurse', 'Patient']), TryCatch(async (req, res) => {
    let day = req.params.day
    let user = req.user
    let appointments
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { day, patientId }
        appointments = await filterAppointment(PatientQueryObj)
    } else if (user.type === 'Nurse') {
        let NurseQueryObj = { day }
        appointments = await filterAppointment(NurseQueryObj)
    }
    SendResponse(res, 200, appointments)
})
)

//Update appointment by id for patient and nurse :Done
router.patch('/id/:id', Auth(['Nurse', 'Patient']), TryCatch(async (req, res) => {
    let id = req.params.id
    let user = req.user
    let Data = req.body
    let result
    // try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        result = await updateAppointment(PatientQueryObj, Data, user.type)

        //Log to database for patient
        let patient = await Patient.findByPk(patientId)
        let message = `${patient.firstName} ${patient.lastName} update his appointment with id ${id}`
        await LogToDataBase(message, Today, user.type, user.id)

    } else if (user.type === 'Nurse') {
        let DoctorQueryObj = { id }
        result = await updateAppointment(DoctorQueryObj, Data, user.type)

        let appointment = await Appointment.findOne({
            where: { id },
            attributes: AppointmentInfo,
            include: [{
                model: Doctor,
                attributes: DoctorInfo
            }, {
                model: Patient,
                attributes: PatientInfo
            }]
        })

        //Log to database for nurse
        let nurse = await User.findByPk(user.id)
        let patient = await Patient.findByPk(appointment.patientId)
        let message = `A nurse ${nurse.username} update appointment with id ${id} to ${patient.firstName} ${patient.lastName} and patientId is ${patient.id}`
        await LogToDataBase(message, Today, user.type, user.id)
        let patientMessage = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            headings: { "en": "Afia Clinics" },
            contents: {
                "en": `Your Appointment with Dr.${appointment.doctor.firstName} ${appointment.doctor.lastName} has been ${appointment.status} at ${appointment.date} ${appointment.startTime}`
            },
            filters: [
                {
                    "field": "tag",
                    "key": "dest",
                    "relation": "=",
                    "value": "patient"
                }, {
                    "field": "tag",
                    "key": "afiaId",
                    "relation": "=",
                    "value": `${appointment.patient.id}`
                }
            ],
            data: { "type": "appointment", "id": `${appointment.id}` }
        };
        pushNotification(patientMessage);

        if (appointment.status == "Accepted") {
            let doctorMessage = {
                app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
                headings: { "en": "Afia Clinics" },
                contents: {
                    "en": `You have new appointment with ${appointment.patient.firstName} ${appointment.patient.lastName} at ${appointment.date} ${appointment.startTime} `
                },
                filters: [
                    {
                        "field": "tag",
                        "key": "dest",
                        "relation": "=",
                        "value": "doctor"
                    }, {
                        "field": "tag",
                        "key": "afiaId",
                        "relation": "=",
                        "value": `${appointment.doctor.id}`
                    }
                ],
                data: { "type": "appointment", "id": `${appointment.id}` }
            };
            pushNotification(doctorMessage);
        }
    }

    SendResponseWithMessage(res, 200, `Update operation done and updated ${result} apponitment`)
})
)

//Delete appointment by id for patient and nurse :Done
router.delete('/id/:id', Auth(['Nurse', 'Patient']), TryCatch(async (req, res) => {
    let id = req.params.id
    let user = req.user
    let result
    //try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        result = await deleteAppointment(PatientQueryObj)
    } else if (user.type === 'Nurse') {
        let NurseQueryObj = { id }
        result = await deleteAppointment(NurseQueryObj)
    }
    SendResponseWithMessage(res, 200, `Delete operation done and deleted ${result} apponitment`)
    //res.status(200).json({ DeleteResult: `Delete operation done and deleted ${result} apponitment` })
    // } catch (e) {
    //     res.status(403).send(e.message)
    // }
})
)

//Update apponitment by doctor in specific day and after specific houre :Done
//Make status Canceled
//Need doctor id or ask for Auth
router.patch('/day/:day/hour/:hour', Auth(['Nurse']), TryCatch(async (req, res) => {
    const { Op } = require("sequelize");
    let day = req.params.day
    let hour = req.params.hour
    //try {
    let appointment = await Appointment.findAll({
        where: { day, startTime: { [Op.gte]: hour } }
    })
    for (let item = 0; item < appointment.length; item++) {
        appointment[item].status = 'Canceled'
        await appointment[item].save()
    }
    SendResponseWithMessage(res, 200, `All appointment after ${hour} were canceled`)
    //res.status(200).json({ Result: `Done` })
    // } catch (e) {
    //     res.status(403).send(e.message)
    // }

    //try to fix it futer
    //Appointment.bulkCreate(appointment, { updateOnDuplicate: ['status'] })


})
)

//Appointment tools
//First tool :Change status for array of appointments (indexes)
router.patch('/tools/change_status', Auth(['Nurse']), TryCatch(async (req, res) => {

    let indexes = req.body.indexes
    //try {
    let updateResult = await Appointment.update({ status: 'Canceled By Nurse' }, {
        where: { id: indexes },
        returning: true,
        plain: true
    })
    //if (indexes.length == updateResult[1])
    SendResponseWithMessage(res, 200, ` ${updateResult[1]} Appointments status updated`)
    //res.status(200).json({ Message: ` ${updateResult[1]} Appointments status updated` })
    // } catch (e) {
    //     res.status(403).send({ ErrorMessage: e.message })
    // }

})
)

//Get empty time for specific doctor in specific day
router.get('/empty_time/doctorId/:id/day/:day/date/:date', TryCatch(async (req, res) => {
    let doctorId = req.params.id
    let day = req.params.day
    let date = req.params.date
    let unReservedTime = new Array()

    let workTimeList = await DoctorDay.findAll({
        where: { day, doctorId },
        attributes: ['startTime', 'endTime']
    })

    if (workTimeList.length == 0)
        return SendResponseWithMessage(res, 403, 'Check if doctor work in this day')

    for (let index = 0; index < workTimeList.length; index++) {
        let appointments = await Appointment.findAll({
            where: {
                day, date, doctorId,
                startTime: { [Op.gte]: workTimeList[index].startTime },
                endTime: { [Op.lte]: workTimeList[index].endTime },
                status: 'Accepted'
                //[Op.or]: [{ status: 'Accepted' }, { status: 'Pending' }]
            },
            order: [['startTime', 'ASC']]
        })
        if (appointments.length == 0)
            unReservedTime.push(workTimeList[index])
        else {
            let inPeriod = unReservedTimeInPeriod(appointments, workTimeList[index].startTime, workTimeList[index].endTime)
            console.log(inPeriod);
            unReservedTime = unReservedTime.concat(inPeriod)
        }
    }
    SendResponse(res, 200, unReservedTime)
})
)

//Get accepted appointments today without sessions 
router.get('/accepted_today', Auth(['Doctor']), TryCatch(async (req, res) => {

    let user = req.user
    let doctorId = await getDoctorID(user)
    let acceptedAppointmentsToday = await Appointment.findAll({
        where: {
            date: Today, status: 'Accepted',
            doctorId, sessionId: { [Op.is]: null }
        },
        attributes: AppointmentInfo
    })

    if (acceptedAppointmentsToday.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no accepted appointments today for you.')
    SendResponse(res, 200, acceptedAppointmentsToday)
})
)

//Change status to rejected before specific time 
router.patch('/before/time/:time/date/:date', Auth(['Doctor']), TryCatch(async (req, res) => {

    let time = req.params.time
    let date = req.params.date
    let user = req.user
    let doctorId = await getDoctorID(user)

    let appointments = await Appointment.findAll({
        where: { date, startTime: { [Op.lte]: time }, doctorId }
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments to reject.')

    let updatedRows = await Appointment.update({ status: 'Rejected' }, {
        where: { date, startTime: { [Op.lte]: time }, doctorId },
        returning: true,
        plain: true
    })
    if (updatedRows[1] == 0)
        return SendResponseWithMessage(res, 200, 'There are no appointments status converted to reject.')
    SendResponseWithMessage(res, 200, `There are ${updatedRows[1]} appointments status converted to reject`)
})
)

//Change status to rejected after specific time 
router.patch('/after/time/:time/date/:date', Auth(['Doctor']), TryCatch(async (req, res) => {

    let time = req.params.time
    let date = req.params.date
    let user = req.user
    let doctorId = await getDoctorID(user)

    let appointments = await Appointment.findAll({
        where: { date, startTime: { [Op.gte]: time }, doctorId }
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments to reject.')

    let updatedRows = await Appointment.update({ status: 'Rejected' }, {
        where: { date, startTime: { [Op.gte]: time }, doctorId },
        returning: true,
        plain: true
    })
    if (updatedRows[1] == 0)
        return SendResponseWithMessage(res, 200, 'There are no appointments status converted to reject.')
    SendResponseWithMessage(res, 200, `There are ${updatedRows[1]} appointments status converted to reject`)
})
)


//Change status to rejected for specific day
router.patch('/reject_day/date/:date', Auth(['Doctor']), TryCatch(async (req, res) => {

    let date = req.params.date
    let user = req.user
    let doctorId = await getDoctorID(user)

    let appointments = await Appointment.findAll({
        where: { date, doctorId }
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments to reject.')

    let updatedRows = await Appointment.update({ status: 'Rejected' }, {
        where: { date, doctorId },
        returning: true,
        plain: true
    })
    if (updatedRows[1] == 0)
        return SendResponseWithMessage(res, 200, 'There are no appointments status converted to reject.')
    SendResponseWithMessage(res, 200, `There are ${updatedRows[1]} appointments status converted to reject`)
})
)


//Appointment Filter For Nurse Tools

//Get appointment in specific day for specific doctor after specific time 
router.get('/day/:day/doctorId/:doctorId/hour/:hour', Auth(['Nurse']), TryCatch(async (req, res) => {
    let day = req.params.day
    let doctorId = req.params.doctorId
    let hour = req.params.hour
    const { Op } = require("sequelize");
    let appointments = await Appointment.findAll({
        where: { day, doctorId, startTime: { [Op.gte]: hour } },
        attributes: AppointmentInfo,

    })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, `No appointments with this properties`)
    // return res.status(404).json({ ErrorMessage: `No appointments with this properties` })
    SendResponse(res, 200, appointments)
    // res.status(200).json(appointments)

})
)

//Get appointment in specific day for specific doctor between two time 
router.get('/day/:day/doctorId/:doctorId/startTime/:startTime/endTime/:endTime', Auth(['Nurse']), TryCatch(async (req, res) => {
    let day = req.params.day
    let doctorId = req.params.doctorId
    let startTime = req.params.startTime
    let endTime = req.params.endTime
    const { Op } = require("sequelize");
    let appointments = await Appointment.findAll({
        where: {
            day,
            doctorId,
            startTime: {
                [Op.gte]: startTime
            },
            endTime: {
                [Op.lte]: endTime

            }
        },
        attributes: AppointmentInfo,

    })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, `No appointments with this properties`)
    // return res.status(404).json({ ErrorMessage: `No appointments with this properties` })
    SendResponse(res, 200, appointments)
    //res.status(200).json(appointments)

})
)

//Get accepted appointment for specific doctor with patients name today
router.get('/accepted', Auth(['Doctor']), TryCatch(async (req, res) => {
    let user = req.user

    let doctorId = await getDoctorID(user)
    let appointments = await Appointment.findAll({
        where: { doctorId, date: Today, status: 'Accepted', sessionId: null },
        include: { model: Patient, attributes: PatientMainInfo },
        attributes: AppointmentInfo
    })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, `No appointments for you.`)

    SendResponse(res, 200, appointments)
})
)

//Get pending appointment for specific doctor
router.get('/doctorId/:doctorId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let doctorId = req.params.doctorId
    // try {
    let doctor = await Doctor.findOne({
        where: { id: doctorId }
    })
    if (!doctor)
        return SendResponseWithMessage(res, 404, 'There is no doctor with this id')
    // {
    //     res.statusMessage = "there is no doctor with this id"
    //     res.status(404).end()
    // }

    let appointments = await Appointment.findAll({
        where: { doctorId, status: 'Pending' },
        //include: { model: Patient, attributes: PatientMainInfo },
        attributes: AppointmentInfo
    })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no pending appointment')
    // {
    //     res.statusMessage = "there are no pending appointment"
    //     res.status(404).end()
    // }
    //return res.status(404).json({ Message: `There are no appointments.` })
    SendResponse(res, 200, appointments)
    //res.status(200).send(appointments)
    // } catch (e) {
    //     // res.status(403).send({ ErrorMessage: e.message })
    //     res.statusMessage = e.message
    //     res.status(403).end()

    // }
})

)

//Get appointment for specific doctor and get pending appointment in specific day 
router.get('/doctorId/:doctorId/date/:date', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let doctorId = req.params.doctorId
    let date = req.params.date
    //try {
    let doctor = await Doctor.findOne({
        where: { id: doctorId }
    })
    if (!doctor)
        return SendResponseWithMessage(res, 404, 'There is no doctor with this id')
    // {
    //     res.statusMessage = "there is no doctor with this id"
    //     res.status(404).end()
    // }
    let appointments = await Appointment.findAll({
        where: { doctorId, status: 'Pending', date },
        attributes: AppointmentInfo
    })
    //if (appointments.length == 0) return res.status(404).json({ Message: `There are no appointments.` })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no pending appointment')
    // {
    //     res.statusMessage = "there are no pending appointment"
    //     res.status(404).end()
    // }
    SendResponse(res, 200, appointments)

    //        res.status(200).send(appointments)
    // } catch (e) {
    //     // res.status(403).send({ ErrorMessage: e.message })
    //     res.statusMessage = e.message
    //     res.status(403).end()
    // }
})
)

//Get Accepted appointment for specific doctor 
router.get('/accepted/doctorId/:doctorId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let doctorId = req.params.doctorId
    // try {
    let doctor = await Doctor.findOne({
        where: { id: doctorId }
    })
    if (!doctor)
        return SendResponseWithMessage(res, 404, 'There is no doctor with this id')
    // {
    //     res.statusMessage = "there is no doctor with this id"
    //     res.status(404).end()
    // }
    let appointments = await Appointment.findAll({
        where: { doctorId, status: 'Accepted' },
        attributes: AppointmentInfo
    })
    //if (appointments.length == 0) return res.status(404).json({ Message: `There are no appointments.` })
    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no pending appointment')
    // {
    //     res.statusMessage = "there are no pending appointment"
    //     res.status(404).end()
    // }
    SendResponse(res, 200, appointments)
    //        res.status(200).send(appointments)
    // } catch (e) {
    //     //res.status(403).send({ ErrorMessage: e.message })
    //     res.statusMessage = e.message
    //     res.status(403).end()
    // }
})
)

//Get all appointment and his sessions for specific patient
router.get('/full/id/:patientId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let patientId = req.params.patientId
    let FullAppointments = new Array()

    let appointments = await Appointment.findAll({
        where: { patientId, sessionId: { [Op.ne]: null } },
        attributes: AppointmentInfo,
    })
    console.log(appointments[0]);
    for (let index = 0; index < appointments.length; index++) {
        //find session 
        let session = await Session.findOne({
            where: { id: appointments[index].sessionId },
            attributes: SessionInfo,
        })

        //find session photos
        let photos = await Photo.findAll({
            where: { sessionId: session.id },
            attributes: PhotoInfo,
        })

        let AppointmentObj = new FullAppointmentObj(appointments[index], session, photos)
        FullAppointments.push(AppointmentObj)
    }

    SendResponse(res, 200, FullAppointments)
})
)

//Cancel appointment for patient
router.patch('/cancel/id/:appointmentId', Auth(['Patient']), TryCatch(async (req, res) => {

    let id = req.params.appointmentId
    let user = req.user
    let patientId = await getPatientID(user)

    let appointment = await Appointment.findOne({
        where: { id, patientId }
    })

    if (!appointment) return SendResponseWithMessage(res, 404, 'There is no appointment with this data.')
    if (appointment.status == 'Cancelled') return SendResponseWithMessage(res, 403, 'This appointment has been cancelled.')

    let updatedRow = await Appointment.update({ status: 'Cancelled' }, {
        where: { id, patientId, [Op.or]: [{ status: 'Pending' }, { status: 'Accepted' }] }
    })

    if (updatedRow[1] == 0)
        return SendResponseWithMessage(res, 403, 'An error occurred while updating.')

    //Log to database for patient
    let patient = await Patient.findByPk(patientId)
    let message = `${patient.firstName} ${patient.lastName} try to update appointment with id ${id} and patientId is ${patient.id}`
    await LogToDataBase(message, Today, user.type, user.id)

    let updatedAppointment = await Appointment.findOne({
        where: { id, patientId, status: 'Cancelled' },
        attributes: AppointmentInfo
    })

    SendResponse(res, 200, updatedAppointment)
})
)

//Cancel appointment for nurse
router.patch('/cancel/id/:appointmentId/patientId/:patientId', Auth(['Nurse']), TryCatch(async (req, res) => {

    let id = req.params.appointmentId
    let patientId = req.params.patientId

    let appointment = await Appointment.findOne({
        where: { id, patientId }
    })

    if (!appointment) return SendResponseWithMessage(res, 404, 'There is no appointment with this data.')
    if (appointment.status == 'Cancelled') return SendResponseWithMessage(res, 403, 'This appointment has been cancelled.')

    let updatedRow = await Appointment.update({ status: 'Cancelled' }, {
        where: { id, patientId, [Op.or]: [{ status: 'Pending' }, { status: 'Accepted' }] }
    })

    if (updatedRow[1] == 0)
        return SendResponseWithMessage(res, 403, 'An error occurred while updating.')

    let updatedAppointment = await Appointment.findOne({
        where: { id, patientId, status: 'Cancelled' },
        attributes: AppointmentInfo
    })

    SendResponse(res, 200, updatedAppointment)
}))

//Get done appointment to doctor by patient id
router.get('/done/id/:patientId', Auth(['Doctor']), TryCatch(async (req, res) => {

    let user = req.user
    let doctorId = await getDoctorID(user)
    let patientId = req.params.patientId
    let appointments = await Appointment.findAll({
        where: { patientId, doctorId, status: 'Done' },
        attributes: AppointmentInfo
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments for this patient.')
    SendResponse(res, 200, appointments)
})
)

//Change status for appointment by id 
router.patch('/id/:id/status/:status', Auth(['Nurse']), TryCatch(async (req, res) => {

    let id = req.params.id
    let status = req.params.status
    let appointment = await Appointment.findOne({
        where: { id },
        attributes: AppointmentInfo,
        include: [{
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Patient,
            attributes: PatientInfo
        }]
    })
    if (!appointment) return SendResponseWithMessage(res, 404, 'There are no appointment with this data.')

    appointment.status = status
    appointment.save()

    let patientMessage = {
        app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
        headings: { "en": "Afia Clinics" },
        contents: {
            "en": `Your Appointment with Dr.${appointment.doctor.firstName} ${appointment.doctor.lastName} has been ${appointment.status} at ${appointment.date} ${appointment.startTime}`
        },
        filters: [
            {
                "field": "tag",
                "key": "dest",
                "relation": "=",
                "value": "patient"
            }, {
                "field": "tag",
                "key": "afiaId",
                "relation": "=",
                "value": `${appointment.patient.id}`
            }
        ],
        data: { "type": "appointment", "id": `${appointment.id}` }
    };
    pushNotification(patientMessage);

    if (appointment.status == "Accepted") {
        let doctorMessage = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            headings: { "en": "Afia Clinics" },
            contents: {
                "en": `You have new appointment with ${appointment.patient.firstName} ${appointment.patient.lastName} at ${appointment.date} ${appointment.startTime} `
            },
            filters: [
                {
                    "field": "tag",
                    "key": "dest",
                    "relation": "=",
                    "value": "doctor"
                }, {
                    "field": "tag",
                    "key": "afiaId",
                    "relation": "=",
                    "value": `${appointment.doctor.id}`
                }
            ],
            data: { "type": "appointment", "id": `${appointment.id}` }
        };
        pushNotification(doctorMessage);
    }
    SendResponse(res, 200, appointment)

})
)

//Get done and accepted appointments to doctor
router.get('/accepted_and_done', Auth(['Doctor']), TryCatch(async (req, res) => {

    let user = req.user
    let doctorId = await getDoctorID(user)

    let appointments = await Appointment.findAll({
        where: { doctorId, [Op.or]: [{ status: 'Accepted' }, { status: 'Done' }] },
        attributes: AppointmentInfo
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments.')
    SendResponse(res, 200, appointments)
})
)

//Get appointments have type in specific date 
router.get('/type/:type/date/:date', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    let type = req.params.type
    let date = req.params.date

    let appointments = await Appointment.findAll({
        where: { date, status: type },
        attributes: AppointmentInfo
    })

    if (appointments.length == 0)
        return SendResponseWithMessage(res, 404, 'There are no appointments.')
    SendResponse(res, 200, appointments)
})
)

//Get appointment for patient
router.get('/for_patient/id/:id', Auth(['Patient']), TryCatch(async (req, res) => {

    let id = req.params.id
    let user = req.user
    let patientId = await getPatientID(user)

    let appointment = await Appointment.findOne({
        where: { patientId, id },
        attributes: AppointmentInfo
    })

    if (!appointment) return SendResponseWithMessage(res, 404, 'There are no appointment with this data.')

    SendResponse(res, 200, appointment)

})
)



//From stevvvvvvvvvvvvvvvvv
//Get Accepted appointment for specfic doctor in specfic date
router.get('/accepted/doctorId/:doctorId/date=:dateValue', Auth(['Admin', 'Nurse']), async (req, res) => {
    const doctorId = req.params.doctorId
    const date = req.params.dateValue
    console.log("mostafa", doctorId, date)
    try {
        const doctor = await Doctor.findOne({
            where: { id: doctorId }
        })
        if (!doctor) {
            res.statusMessage = "there is no doctor with this id"
            res.status(404).end()
        }
        const appointments = await Appointment.findAll({
            where: { doctorId, status: 'Accepted', date }
        })
        if (appointments.length === 0) {
            res.statusMessage = "there are no appointments reversed"
            res.status(404).end()
        }
        res.status(200).json(appointments)
    }
    catch (e) {
        res.statusMessage = e.message
        res.status(403).end()
    }
})

//get All pending appoitnments by specfic clinic
router.get('/clinicId/:clinicId', Auth(['Admin', 'Nurse']), async (req, res) => {
    const clinicId = req.params.clinicId
    try {
        let clinicData = await Clinic.findOne({
            where: { id: clinicId },
        })

        if (!clinicData) {
            res.statusMessage = 'No clinic with this id'
            return res.status(404).end()
        }
        let appointments = await Appointment.findAll({
            where: { clinicId, status: 'Pending' },
            attributes: AppointmentInfo
        })
        if (appointments.length === 0) {
            res.statusMessage = 'There are no appointments for this clinics'
            return res.status(404).end()
        }
        res.status(200).json(appointments)
    }
    catch (e) {
        res.statusMessage = e.message
        res.status(403).end()
    }
})

//get All accepted appoitnments by specfic clinic and data
router.get('/accepted/clinicId/:clinicId/date=:dateValue', Auth(['Admin', 'Nurse']), async (req, res) => {
    const clinicId = req.params.clinicId
    const date = req.params.dateValue
    try {
        let clinic = await Clinic.findOne({
            where: { id: clinicId }
        })
        if (!clinic) {
            res.statusMessage = "No clinic with this id"
            res.status(404).end()
        }
        let appoinments = await Appointment.findAll({
            where: { clinicId, status: 'Accepted', date }
        })
        if (appoinments.length === 0) {
            res.statusMessage = "there are no appointments reversed"
            res.status(404).end()
        }
        res.status(200).json(appoinments)
    }
    catch (e) {
        res.statusMessage = e.message
        console.log(e.message)
        res.status(403).end()
    }
})

//get all accepted appointments for clinic
router.get('/accepted/clinicId/:clinicId', Auth(['Admin', 'Nurse']), async (req, res) => {
    const clinicId = req.params.clinicId
    const date = req.params.dateValue
    try {
        let clinic = await Clinic.findOne({
            where: { id: clinicId }
        })
        if (!clinic) {
            res.statusMessage = "No clinic with this id"
            res.status(404).end()
        }
        let appoinments = await Appointment.findAll({
            where: { clinicId, status: 'Accepted' }
        })
        if (appoinments.length === 0) {
            res.statusMessage = "there are no appointments accepted"
            res.status(404).end()
        }
        res.status(200).json(appoinments)
    }
    catch (e) {
        res.statusMessage = e.message
        console.log(e.message)
        res.status(403).end()
    }
})

//get pending appointment in specific date
router.get('/clinicId/:clinicId/date/:date', Auth(['Admin', 'Nurse']), async (req, res) => {
    const clinicId = req.params.clinicId
    const date = req.params.date

    try {
        let clinicData = await Clinic.findOne({
            where: { id: clinicId },
        })

        if (!clinicData) {
            res.statusMessage = 'No clinic with this id'
            return res.status(404).end()
        }
        let appointments = await Appointment.findAll({
            where: { clinicId, status: 'Pending', date },
            attributes: AppointmentInfo
        })
        if (appointments.length === 0) {
            res.statusMessage = 'There are no appointments for this clinics'
            return res.status(404).end()
        }
        res.status(200).json(appointments)
    }
    catch (e) {
        res.statusMessage = e.message
        res.status(403).end()
    }
})


module.exports = router

/*
//Get reserved appoinment for specific doctor in specific day
//please fix it
router.get('/reserved_appoinment', async(req, res) => {
    let appoinments = await Appoinment.findAll({
        order: [
            ['startTime', 'ASC'],
        ],
    })

    let reservedAppoinment = ReservedAppoinment(appoinments)
    res.status(200).json(reservedAppoinment)
})
*/

/*const { Op } = require("sequelize");
let day = req.params.day
let hour = req.params.hour
try {
    let result = await Appointment.destroy({
        where: {
            day,
            startTime: {
                [Op.gte]: hour
            }
        }
    })
    res.status(200).json({ DeleteResult: `Delete operation done and deleted ${result} apponitment` })
} catch (e) {
    res.status(403).send(e)
}
    let data = new Array()

 // for (let index = 0; index < appointments.length; index++) {
        //     let patient = await Patient.findOne({
        //         where: { id: appointments[index].patientId },
        //         attributes: PatientInfo
        //     })
        //     let appointment = new AcceptedAppointmentWithPatientNameObj(appointments[index].id,
        //         appointments[index].day, appointments[index].data, appointments[index].startTime,
        //         appointments[index].endTime, appointments[index].type, appointments[index].description,
        //         appointments[index].status, patient.firstName, patient.lastName)

        //     data.push(appointment)
        //}


// //Get appointment for specific doctor with patients name in specific day
// router.get('/accepted/day/:day', Auth(['Admin', 'Doctor']), async (req, res) => {
//     let day = req.params.day
//     let user = req.user
//     try {
//         let doctorId = await getDoctorID(user)
//         let appointments = await Appointment.findAll({
//             where: { doctorId, status: 'Accepted', day, sessionId: null },
//             include: { model: Patient, attributes: PatientMainInfo },
//             attributes: AppointmentInfo
//         })
//         if (appointments.length == 0) return res.status(404).json({ Message: `No appointments in ${day} for you.` })
//         res.status(200).send(appointments)
//     } catch (e) {
//         res.status(403).send({ ErrorMessage: e.message })
//     }
// })

 let workTimeList = await DoctorDay.findAll({
        where: { day, doctorId },
        attributes: ['startTime', 'endTime']
    })
    //console.log(workTimeList);
    if (workTimeList.length == 0)
        return SendResponseWithMessage(res, 403, 'Check if doctor work in this day')

    // let appointments = await Appointment.findAll({
    //     where: { day, date, doctorId },
    //     order: [['startTime', 'ASC']]
    // })
    // if (appointments.length == 0)
    //     return SendResponse(res, 200, workTimeList)

    //let unReservedTime = UnReservedTime(appointments, workTimeInDay.startTime, workTimeInDay.endTime)
    let unReservedTime = UnReservedTime(appointments, workTimeList)
    SendResponse(res, 200, unReservedTime)



*/

/*
//Get empty time for specific doctor in specific day
router.get('/empty_time/doctorId/:id/day/:day/date/:date', TryCatch(async (req, res) => {
    let doctorId = req.params.id
    let day = req.params.day
    let date = req.params.date
    let unReservedTime = new Array()

    let workTimeList = await DoctorDay.findAll({
        where: { day, doctorId },
        attributes: ['startTime', 'endTime']
    })

    if (workTimeList.length == 0)
        return SendResponseWithMessage(res, 403, 'Check if doctor work in this day')

    for (let index = 0; index < workTimeList.length; index++) {
        let appointments = await getAppointmentAfterSpecificTime(workTimeList[index], doctorId, day, date)
        let inPeriod = unReservedTimeInPeriod(appointments, workTimeList[index].startTime, workTimeList[index].endTime)
        console.log(inPeriod);
        unReservedTime = unReservedTime.concat(inPeriod)
    }

    SendResponse(res, 200, unReservedTime)
})
)

*/