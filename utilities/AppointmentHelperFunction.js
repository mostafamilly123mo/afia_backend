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


//Var
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber', 'description',
    'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let AppointmentInfo = ['id', 'day', 'date', 'startTime', 'endTime', 'type',
    'description', 'status', 'doctorId', 'patientId', 'sessionId', 'clinicId']
let SessionInfo = ['id', 'medicine', 'doctorReport']

let getPatientID = async function (user) {
    let patient = await Patient.findOne({ where: { userId: user.id } })
    return patient.id
}

let getDoctorID = async function (user) {
    let doctor = await Doctor.findOne({ where: { userId: user.id } })
    return doctor.id
}

let filterAppointment = async function (FilterObj) {
    let appointments = await Appointment.findAll({
        where: FilterObj,
        attributes: AppointmentInfo
    })
    return appointments
}

let updateAppointment = async function (FilterObj, Data, UpdaterType) {
    const apponitment = await Appointment.findOne({ where: FilterObj })
    try {
        if (UpdaterType === 'Patient') {
            if (apponitment.status == 'Pending') {
                const affectedRows = await Appointment.update(Data, {
                    where: FilterObj,
                    returning: true,
                    plain: true
                })
                return affectedRows[1]
            } else {
                return 'Can not update this apponitment because it is in queue, to update this appointment go back to nurse.'
            }
        } else {
            const affectedRows = await Appointment.update(Data, {
                where: FilterObj,
                returning: true,
                plain: true
            })
            return affectedRows[1]
        }

    } catch (e) {
        console.log(e.message)
    }
}

let deleteAppointment = async function (FilterObj) {
    try {
        const affectedRows = await Appointment.destroy({ where: FilterObj })
        if (affectedRows == 0)
            return 'Sorry no appointment to delete'
        return affectedRows
    } catch (e) {
        console.log(e.message)
    }
}


let appointmentIdValidation = async function (req, res, next) {
    let id = req.params.id
    let appointment = await Appointment.findByPk(id)

    if (!appointment) return res.status(404).json({ ErrorMessage: "Please ckeck appointment id is correct." })
    next()
}

module.exports = {
    getPatientID, getDoctorID, filterAppointment
    , updateAppointment, deleteAppointment, appointmentIdValidation
}


/**
 * let filterAppointment = async function(FilterObj) {
    let appointments = await Appointment.findAll({
        where: FilterObj,
        attributes: AppointmentInfo,
        include: [{
            model: Patient,
            attributes: PatientInfo
        }, {
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Session,
            attributes: SessionInfo
        }]
    })
    return appointments
}

 */