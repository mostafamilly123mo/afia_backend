//Packages
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

//Var
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber', 'description',
    'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let PatientMainInfo = ['id', 'firstName', 'lastName', 'birthday']

let ConsultationInfo = ['id', 'question', 'questionDate', 'answer', 'answerDate', 'status', 'clinicId', 'doctorId', 'patientId']

let getPatientID = async function (user) {
    let patient = await Patient.findOne({ where: { userId: user.id } })
    return patient.id
}

let getDoctorID = async function (user) {
    let doctor = await Doctor.findOne({ where: { userId: user.id } })
    return doctor.id
}

let filterConsultation = async function (FilterObj) {
    let consultations = await Consultation.findAll({
        where: FilterObj,
        //include: { model: Patient, attributes: PatientMainInfo },
        attributes: ConsultationInfo
    })
    return consultations
}

let updateConsultation = async function (FilterObj, Data, UpdaterType) {
    const consultation = await Consultation.findOne({ where: FilterObj })

    try {
        if (UpdaterType === 'Patient') {
            if (!consultation.answer) {
                const affectedRows = await Consultation.update(Data, {
                    where: FilterObj,
                    returning: true,
                    plain: true
                })
                if (affectedRows[1] > 0) {
                    let updatedConsultation = await Consultation.findOne({
                        where: { id: FilterObj.id },
                        attributes: ConsultationInfo
                    })
                    return updatedConsultation
                }
            } else {
                return 'Can not update this consultation because it is answered.'
            }
        } else {
            if (!consultation.answer) {
                const affectedRows = await Consultation.update(Data, {
                    where: FilterObj,
                    returning: true,
                    plain: true
                })
                let date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
                consultation.status = 'Done'
                consultation.answerDate = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD');
                await consultation.save()
                if (affectedRows[1] > 0) {
                    let updatedConsultation = await Consultation.findOne({
                        where: { id: FilterObj.id },
                        attributes: ConsultationInfo
                    })
                    return updatedConsultation
                }
            } else {
                return 'Can not update this consultation because it is answered.'
            }
        }
    } catch (e) {
        console.log(e.message)
    }
}

let deleteConsultations = async function (FilterObj) {
    try {
        const affectedRows = await Consultation.destroy({ where: FilterObj })
        if (affectedRows == 0)
            return 'Sorry no consultation to delete'
        return affectedRows
    } catch (e) {
        console.log(e.message)
    }


}


module.exports = { getPatientID, getDoctorID, filterConsultation, updateConsultation, deleteConsultations }



/*
let filterConsultation = async function (FilterObj, Model, ModelInfo) {
    let consultations = await Consultation.findAll({
        where: FilterObj,
        include: [{
            model: Model,
            attributes: ModelInfo
        }],
        attributes: ConsultationInfo
    })
    return consultations
}






let updatedConsultation = async function (FilterObj, Data, UpdaterType) {
    const consultation = await Consultation.findOne({ where: FilterObj })
    try {
        if (UpdaterType === 'Patient') {
            if (!consultation.answer) {
                const affectedRows = await Consultation.update(Data, {
                    where: FilterObj,
                    returning: true,
                    plain: true
                })
                return `${affectedRows[1]} were successfully updated`
            } else {
                return 'Can not update this consultation because it is answered.'
            }
        } else {
            if (!consultation.answer) {
                const affectedRows = await Consultation.update(Data, {
                    where: FilterObj,
                    returning: true,
                    plain: true
                })
                consultation.status = 'Done'
                consultation.answerDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
                await consultation.save()
                return `${affectedRows[1]} were successfully updated`
            } else {
                return 'Can not update this consultation because it is answered.'
            }
        }
    } catch (e) {
        console.log(e.message)
    }
}

*/