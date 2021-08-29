//Helper Function
let { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
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


let getAppointmentAfterSpecificTime = async function (workTime, doctorId, day, date) {
    let appointments = await Appointment.findAll({
        where: {
            day, date, doctorId,
            startTime: { [Op.gte]: workTime.startTime },
            endTime: { [Op.lte]: workTime.endTime }
        },
        order: [['startTime', 'ASC']]
    })
    if (appointments.length == 0)
        return workTime;
    return appointments
}

let unReservedTimeInPeriod = function (appointments, st, en) {
    class Time {
        constructor(startTime, endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }
    }
    let unReservedTime = new Array();
    let emptyTime
    //Check first appointment 
    if (st != appointments[0].startTime) {
        emptyTime = new Time(st, appointments[0].startTime)
        unReservedTime.push(emptyTime)
        // console.log(emptyTime);
    }
    //Check middle appointment
    for (let i = 0; i < appointments.length - 1; i++) {
        if (appointments[i].endTime != appointments[i + 1].startTime) {
            emptyTime = new Time(appointments[i].endTime, appointments[i + 1].startTime)
            unReservedTime.push(emptyTime)
            //console.log(emptyTime);

        }
    }
    //Check last appointment
    if (appointments[appointments.length - 1].endTime != en) {
        emptyTime = new Time(appointments[appointments.length - 1].endTime, en)
        unReservedTime.push(emptyTime)
        // console.log(emptyTime);

    }
  
    return unReservedTime
}
module.exports = { getAppointmentAfterSpecificTime, unReservedTimeInPeriod }


/*


module.exports = function (appointments, st, en) {
    class Time {
        constructor(startTime, endTime) {
            this.startTime = startTime;
            this.endTime = endTime;
        }
    }
    let UnReservedTime = [];
    let emptyTime
    //Check first appointment
    if (st != appointments[0].startTime) {
        emptyTime = new Time(st, appointments[0].startTime)
        UnReservedTime.push(emptyTime)
        console.log(emptyTime);
    }
    //Check middle appointment
    for (let i = 0; i < appointments.length - 1; i++) {
        if (appointments[i].endTime != appointments[i + 1].startTime) {
            emptyTime = new Time(appointments[i].endTime, appointments[i + 1].startTime)
            UnReservedTime.push(emptyTime)
            console.log(emptyTime);

        }
    }
    //Check last appointment
    if (appointments[appointments.length - 1].endTime != en) {
        emptyTime = new Time(appointments[appointments.length - 1].endTime , en)
        UnReservedTime.push(emptyTime)
        console.log("final if" + emptyTime);

    }
    return UnReservedTime
}
 */