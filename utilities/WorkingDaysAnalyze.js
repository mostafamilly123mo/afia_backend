//Load Models 
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


let getDates = require('./GenerateDatesAndDays')


let deleteCalendarAndWorkingDay = async function () {
    let deleteCalendar = await Calendar.destroy({ where: {} })
    let deleteWorkingDays = await WorkingDay.destroy({ where: {} })
}

let generateDates = function (daysNumber) {
    let dates = getDates(new Date(), (new Date()).addDays(daysNumber));
    return dates
}

let insertDatesToCalendarTable = async function (dates) {
    await Calendar.bulkCreate(dates)
}

let analyseCalendarAndInsertDatesToWorkingDays = async function () {
    let allDay = await Calendar.findAll()

    for (let i = 0; i < allDay.length; i++) {
        let inDay = await DoctorDay.findAll({ where: { day: allDay[i].day } })
        for (let j = 0; j < inDay.length; j++) {
            let workDay = new WorkingDay()
            workDay.day = allDay[i].day
            workDay.date = allDay[i].date
            workDay.doctorId = inDay[j].doctorId
            workDay.startTime = inDay[j].startTime
            workDay.endTime = inDay[j].endTime
            await workDay.save()
        }
    }

}

let getWorkingDays = async function () {
    let allworkingDays = await WorkingDay.findAll()
    return allworkingDays
}

let filterWorkingDaysFromHolidays = async function (centerHoliday, doctorHoliday) {
    for (let i = 0; i < centerHoliday.length; i++) {
        let affected = await WorkingDay.destroy({ where: { date: centerHoliday[i].date } })
    }
    for (let i = 0; i < doctorHoliday.length; i++) {
        let affected = await WorkingDay.destroy({ where: { date: doctorHoliday[i].date, doctorId: doctorHoliday[i].doctorId } })
    }
}

let getCenterHolidays = async function () {
    const { Op } = require("sequelize");
    let centerHoliday = await CenterHoliday.findAll({
        where: {
            date: {
                [Op.gte]: (new Date()).toLocaleDateString('pt-br').split('/').reverse().join('-')
            }
        }
    })
    return centerHoliday
}

let getDoctorHolidays = async function () {
    const { Op } = require("sequelize");
    let doctorHoliday = await DoctorHoliday.findAll({
        where: {
            date: {
                [Op.gte]: (new Date()).toLocaleDateString('pt-br').split('/').reverse().join('-')
            }
        }
    })
    return doctorHoliday
}

let f = async function () {
    await deleteCalendarAndWorkingDay()
    let dates = generateDates(20)
    await insertDatesToCalendarTable(dates)
    await analyseCalendarAndInsertDatesToWorkingDays()
    let allworkingDays = await getWorkingDays()
    let centerHoliday = await getCenterHolidays()
    let doctorHoliday = await getDoctorHolidays()
    await filterWorkingDaysFromHolidays(centerHoliday, doctorHoliday)
    console.log('Done');
}

module.exports = f