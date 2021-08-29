const express = require('express')
const moment = require('moment');
const sequelize = require('sequelize')


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

//Classes
let { DoctorObj, Month, ClinicPatientsInMonth } = require('../utilities/Classes')

//Helper Function
const { getDoctorID, getPatientID } = require('../utilities/AppointmentHelperFunction');
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')

const TryCatch = require('../middleware/Error/TryCatch')

let getDayDateInLastWeekBasedToday = function (numberOfDay) {
    var options = {
        year: "numeric",
        month: "2-digit",
        day: "numeric"
    };

    return new Date(new Date().getTime() - ((numberOfDay)) * 24 * 60 * 60 * 1000).toLocaleString("af-ZA", options)

}

let getDoneAppointmentInSpecificDay = function (doneAppointmentPerWeek, day) {
    for (let index = 0; index < doneAppointmentPerWeek.length; index++) {
        if (doneAppointmentPerWeek[index].day == day)
            return doneAppointmentPerWeek[index].count
    }
    return 0

}

let getDate = function (month, day) {
    let date = new Date().getFullYear() + '-' + month + '-' + day
    return moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD');
}
let getYearMonths = function () {
    let Months = new Array()
    Months.push(new Month('January', getDate(1, 1), getDate(1, 31)))
    Months.push(new Month('February', getDate(2, 1), getDate(2, 28)))
    Months.push(new Month('March', getDate(3, 1), getDate(3, 31)))
    Months.push(new Month('April', getDate(4, 1), getDate(4, 30)))
    Months.push(new Month('May', getDate(5, 1), getDate(5, 31)))
    Months.push(new Month('June', getDate(6, 1), getDate(6, 30)))
    Months.push(new Month('July', getDate(7, 1), getDate(7, 31)))
    Months.push(new Month('August', getDate(8, 1), getDate(8, 31)))
    Months.push(new Month('September', getDate(9, 1), getDate(9, 30)))
    Months.push(new Month('October', getDate(10, 1), getDate(10, 31)))
    Months.push(new Month('November', getDate(11, 1), getDate(11, 30)))
    Months.push(new Month('December', getDate(12, 1), getDate(12, 31)))

    return Months
}


//Var 
const { Op } = require("sequelize");
const Today = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
const PreviousMonth = new Date().getFullYear() + '-' + (new Date().getMonth()) + '-' + new Date().getDate()

let UserInfo = ['id', 'username', 'email']
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber',
    'description', 'sepecialize', 'language', 'clinicId']
let WorkDayInfo = ['id', 'day', 'startTime', 'endTime', 'doctorId']
let DoctorHolidayInfo = ['id', 'day', 'date', 'doctorId']
let PhotoInfo = ['id', 'originalname', 'url', 'doctorId', 'categoryId']
let TagInfo = ['id', 'check', 'review', 'consultation', 'doctorId']
let CenterDayInfo = ['id', 'day', 'openTime', 'closeTime']
const ClinicInfo = []

const router = express.Router()

//Get Statistics
router.get('/public', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    //Get genders patients an female patient
    let gender = await Patient.findAll({
        where: {},
        attributes: ['gender', [sequelize.fn('count', sequelize.col('gender')), 'count']],
        group: ['Patient.gender'],
        raw: true
    })
    // console.log(gender)

    //Get today pending appointment
    let todayPendingAppointment = await Appointment.findOne({
        where: { date: Today, status: 'Pending' },
        attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
        raw: true
    })
    // console.log(todayPendingAppointment);

    //Get done appointment
    let allDoneAppointments = await Appointment.findOne({
        where: { status: 'Done' },
        attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
        raw: true
    })
    // console.log(acceptedAppointment);

    //Get all pending appointment
    let allPendingAppointments = await Appointment.findOne({
        where: { status: 'Pending' },
        attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
        raw: true
    })
    //console.log(allPendingAppointment);

    //Get all accepted appointment
    let allAcceptedAppointments = await Appointment.findOne({
        where: { status: 'Accepted' },
        attributes: ['status', [sequelize.fn('count', sequelize.col('status')), 'count']],
        raw: true
    })
    //console.log(allAcceptedAppointments);

    //get monthlyPatient
    let monthlyPatient = await Patient.findOne({
        where: { createdAt: { [Op.gte]: PreviousMonth } },
        attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']],
        raw: true
    })
    //console.log(monthlyPatient);

    //Get all patients
    let allPatient = await Patient.findOne({
        attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']],
        raw: true
    })
    //console.log(allPatient);

    //Get pending appointment per week
    let doneAppointmentPerWeek = new Array()
    for (let index = 0; index < 7; index++) {
        let doneAppointmentInDay = await Appointment.findOne({
            where: { status: 'Done', date: getDayDateInLastWeekBasedToday(index) },
            attributes: ['day', [sequelize.fn('count', sequelize.col('id')), 'count']],
            raw: true
        })
        doneAppointmentPerWeek.push(doneAppointmentInDay)
    }

    //My Objects
    let Gender = new Object()
    if (gender[0]?.gender == 'Male') {
        Gender.male = gender[0]?.count
    }
    else if (gender[0]?.female == 'Female') {
        Gender.female = gender[0]?.count
    }
    if (gender[1]?.gender == 'Female' && !Gender.female) {
        Gender.female = gender[1]?.count
    }
    else if (gender[1]?.gender == 'Male' && !Gender.male) {
        Gender.male = gender[1]?.count
    }

    let TodayPendingAppointment = new Object();
    TodayPendingAppointment.count = todayPendingAppointment.count
    TodayPendingAppointment.totalPendingAppointment = allPendingAppointments.count

    let MonthlyPatient = new Object()
    MonthlyPatient.count = monthlyPatient.count
    MonthlyPatient.totalPatient = allPatient.count

    let TotalPendingAppointment = new Object()
    TotalPendingAppointment.count = allPendingAppointments.count

    let DoneAppointment = new Object()
    DoneAppointment.count = allDoneAppointments.count
    // DoneAppointment.totalPendingAppointment = allPendingAppointments.count
    DoneAppointment.totalAcceptedAppointment = allAcceptedAppointments.count

    let DoneAppointmentPerWeek = new Object()
    DoneAppointmentPerWeek.Sunday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Sunday')
    DoneAppointmentPerWeek.Monday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Monday')
    DoneAppointmentPerWeek.Tuesday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Tuesday')
    DoneAppointmentPerWeek.Wednesday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Wednesday')
    DoneAppointmentPerWeek.Thursday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Thursday')
    DoneAppointmentPerWeek.Friday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Friday')
    DoneAppointmentPerWeek.Saturday = getDoneAppointmentInSpecificDay(doneAppointmentPerWeek, 'Saturday')
    DoneAppointmentPerWeek.totalDoneAppointments = allDoneAppointments.count

    let Statistics = new Object();
    Statistics.Gender = Gender
    Statistics.TodayPendingAppointment = TodayPendingAppointment
    Statistics.MonthlyPatient = MonthlyPatient
    Statistics.TotalPendingAppointment = TotalPendingAppointment
    Statistics.DoneAppointment = DoneAppointment
    Statistics.DoneAppointmentPerWeek = DoneAppointmentPerWeek

    //res.status(200).json(Statistics)
    SendResponse(res, 200, Statistics)
})
)

//Get statistics for specific clinic
router.get('/clinic/:id', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let clinicId = req.params.id

    let clinicPendingAppointments = await Appointment.findOne({
        where: { status: 'Pending', clinicId },
        attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']],
        raw: true
    })

    let clinicDoctors = await Doctor.findOne({
        where: { clinicId },
        attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']],
        raw: true
    })

    let clinicPatients = await Appointment.findAll({
        where: { clinicId, date: { [Op.gte]: PreviousMonth } },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('patientId')), 'patientId']],
        group: ['Appointment.patientId'],
        raw: true
    })

    let clinicStatistics = new Object()
    clinicStatistics.PendingAppointments = clinicPendingAppointments.count
    clinicStatistics.Doctors = clinicDoctors.count
    clinicStatistics.Patients = clinicPatients.length

    //res.status(200).json(clinicStatistics)
    SendResponse(res, 200, clinicStatistics)
})
)

//Get Canceled Appointments For Patient  
router.get('/canceled_appointments/id/:patientId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    let patientId = req.params.patientId
    let CanceledAppointments = await Appointment.findOne({
        where: { [Op.or]: [{ status: 'Cancelled' }, { status: 'Rejected' }], patientId },
        attributes: [[sequelize.fn('count', sequelize.col('id')), 'count']]
    })
    SendResponse(res, 200, CanceledAppointments)

})
)

//Get Appointments Per Week For Special Clinic
router.get('/done_appointments_per_week/id/:clinicId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    let clinicId = req.params.clinicId
    let appointmentsPerWeek = new Array()
    for (let index = 0; index < 7; index++) {
        let appointmentInDay = await Appointment.findOne({
            where: { status: 'Done', clinicId, date: getDayDateInLastWeekBasedToday(index) },
            attributes: ['day', [sequelize.fn('count', sequelize.col('id')), 'count']],
            raw: true
        })
        appointmentsPerWeek.push(appointmentInDay)
    }
    let AppointmentsClinicPerWeek = new Object()
    AppointmentsClinicPerWeek.Sunday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Sunday')
    AppointmentsClinicPerWeek.Monday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Monday')
    AppointmentsClinicPerWeek.Tuesday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Tuesday')
    AppointmentsClinicPerWeek.Wednesday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Wednesday')
    AppointmentsClinicPerWeek.Thursday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Thursday')
    AppointmentsClinicPerWeek.Friday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Friday')
    AppointmentsClinicPerWeek.Saturday = getDoneAppointmentInSpecificDay(appointmentsPerWeek, 'Saturday')
    SendResponse(res, 200, AppointmentsClinicPerWeek)
    // res.status(200).json('rr')
})
)

//Get monthly patient in year
router.get('/monthly_patient_per_year/id/:clinicId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {
    //[Op.and]: [{ a: 5 }, { b: 6 }]
    //[Op.and]: [{ [Op.gte]: '2021-08-01' }, { [Op.lte]: '2021-08-31' }]
    //date: { [Op.between]: ['2021-08-01', '2021-08-31'], } 
    let clinicId = req.params.clinicId
    let months = getYearMonths()
    let monthlyClinicPtients = new Array()
    for (let index = 0; index < months.length; index++) {

        const startDate = new Date(months[index].start);
        const endDate = new Date(months[index].end);

        let monthlyPatientInClinic = await Appointment.findAll({
            where: { clinicId, date: { [Op.between]: [startDate, endDate] } },
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('patientId')), 'patientId']],
        })

        monthlyClinicPtients.push(new ClinicPatientsInMonth(months[index].name, monthlyPatientInClinic.length))
    }

    SendResponse(res, 200, monthlyClinicPtients)

})
)

//Get pending appointment for all clinic 
router.get('/clinics/pending_appointments', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    let appointments = await Appointment.findAll({
        where: { status: 'pending' },
        include: [{
            model: Clinic,
            attributes: ClinicInfo
        }],

        attributes: ['clinic.name', [sequelize.fn('count', sequelize.col('clinicId')), 'count']],
        group: ['Appointment.clinicId'],
        raw: true


    })



    SendResponse(res, 200, appointments)


})
)

module.exports = router

