//Packages
const express = require('express')
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
let { ConsultationObj } = require('../utilities/Classes')

//Helper Function
let { getPatientID, getDoctorID, filterConsultation,
    updateConsultation, deleteConsultations } = require('../utilities/ConsultationHelperFunction')
let { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')
let pushNotification = require('../utilities/PushNotification')


//Var
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber', 'description', 'sepecialize', 'language'];
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address', 'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let ConsultationInfo = ['id', 'question', 'questionDate', 'answer', 'answerDate', 'status', 'clinicId', 'doctorId', 'patientId']
let PhotoInfo = ['id', 'originalname', 'url', 'categoryId']
let PatientMainInfo = ['id', 'firstName', 'lastName', 'birthday']


const router = express.Router()

//Add new consultation use by patient :Done 
router.post('/', Auth(['Patient']), upload(/\.(jpg|jpeg|PNG|png)$/).array('Photos', 3), TryCatch(async (req, res) => {
    let user = req.user

    const { error } = Consultation.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)
    //return res.status(400).json({ ErrorMessage: error.details[0].message })

    let consultation = new Consultation(req.body)
    let photos = new Array();

    //try {
    let patientId = await getPatientID(user)
    let date = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    consultation.patientId = patientId
    consultation.questionDate = moment(date, 'YYYY-MM-DD').format('YYYY-MM-DD');
    await consultation.save()

    if (req.files) {
        for (let index = 0; index < req.files.length; index++) {
            let photo = new Photo(req.files[index])
            const uploadResult = await Cloudinary.uploader.upload(req.files[index].path, {
                folder: 'ConsultationsPhotos',
                public_id: req.files.filename
            });
            photo.url = uploadResult.secure_url
            photo.public_id = uploadResult.public_id
            photo.width = uploadResult.width
            photo.height = uploadResult.height
            photo.uploaderId = patientId
            photo.uploaderType = user.type
            photo.consultationId = consultation.id
            await photo.save()
            photos.push(photo.getPublicData())
        }
    }
    let consultationData = new ConsultationObj(consultation.getPublicData(), photos)

    // let consultationData = new Object()
    // consultationData.consultation = consultation.getPublicData()
    // consultationData.photos = photos

    let newConsultation = await Consultation.findOne({
        where: { id: consultation.id },
        include: [{
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Patient,
            attributes: PatientInfo
        }]
    })

    let doctorMessage = {
        app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
        headings: { "en": "Afia Clinics" },
        contents: {
            "en": `You have new consultation.`
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
                "value": `${newConsultation.doctor.id}`
            }
        ],
        data: { "type": "consultation", "id":`${newConsultation.id}`  }
    };
    pushNotification(doctorMessage);

    SendResponse(res, 201, consultationData)

})
)

//Get one consultation use by patient and doctor by id :Done
router.get('/id/:id', Auth(['Patient', 'Doctor']), TryCatch(async (req, res) => {
    let id = req.params.id
    let user = req.user
    let consultation
    let data = new Object()
    //try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        consultation = await Consultation.findOne({
            where: PatientQueryObj,
            attributes: ConsultationInfo
        })
        let photos = await Photo.findAll({
            where: { consultationId: consultation.id },
            attributes: PhotoInfo
        })
        data.consultation = consultation.getPublicData()
        data.photo = photos

    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        let DoctorQueryObj = { id, doctorId }
        consultation = await Consultation.findOne({
            where: DoctorQueryObj,
            attributes: ConsultationInfo
        })
        let photos = await Photo.findAll({
            where: { consultationId: consultation.id },
            attributes: PhotoInfo
        })
        data.consultation = consultation.getPublicData()
        data.photo = photos
    }
    if (consultation.length == 0)
        return SendResponseWithMessage(res, 404, 'You did not have any consultation yet.')
    //return res.status(404).json({ Message: 'You did not have any consultation yet.' })
    //res.status(200).json(data)
    SendResponse(res, 200, data)

    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)

//Get all consultations(Pending and not Pending) use by patient and Doctor :Done
router.get('/my_consultations', Auth(['Patient', 'Doctor']), TryCatch(async (req, res) => {
    let user = req.user
    let allConsultations
    let consultations = new Array()
    // try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        PatientConsultationsQueryObj = { patientId }
        allConsultations = await filterConsultation(PatientConsultationsQueryObj)
        for (let index = 0; index < allConsultations.length; index++) {
            let photo = await Photo.findAll({
                where: { consultationId: allConsultations[index].id },
                attributes: PhotoInfo
            })
            let consultation = new ConsultationObj(allConsultations[index], photo)
            consultations.push(consultation)
        }
    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        DoctorConsultationsQueryObj = { doctorId }
        allConsultations = await filterConsultation(DoctorConsultationsQueryObj)
        for (let index = 0; index < allConsultations.length; index++) {
            let photo = await Photo.findAll({
                where: { consultationId: allConsultations[index].id },
                attributes: PhotoInfo
            })
            let consultation = new ConsultationObj(allConsultations[index], photo)
            consultations.push(consultation)
        }
    }
    if (allConsultations.length == 0)
        return SendResponseWithMessage(res, 404, 'You did not have any consultation yet.')
    //res.status(404).json({ Message: 'You did not have any consultations yet.' })

    //res.status(200).json(consultations)
    SendResponse(res, 200, consultations)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//Get all pending consultation use by doctor and patient :Done
router.get('/pending', Auth(['Patient', 'Doctor']), TryCatch(async (req, res) => {
    let user = req.user
    let status = 'Pending'
    let allConsultations
    let consultations = new Array()
    // try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PendingQueryObj = { status, patientId }
        allConsultations = await filterConsultation(PendingQueryObj)
        for (let index = 0; index < allConsultations.length; index++) {
            let photo = await Photo.findAll({
                where: { consultationId: allConsultations[index].id },
                attributes: PhotoInfo
            })
            let consultation = new ConsultationObj(allConsultations[index], photo)
            consultations.push(consultation)
        }
    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        let PendingQueryObj = { status, doctorId }
        allConsultations = await filterConsultation(PendingQueryObj)
        for (let index = 0; index < allConsultations.length; index++) {
            let photo = await Photo.findAll({
                where: { consultationId: allConsultations[index].id },
                attributes: PhotoInfo
            })
            let consultation = new ConsultationObj(allConsultations[index], photo)
            consultations.push(consultation)
        }
    }
    if (allConsultations.length == 0)
        return SendResponseWithMessage(res, 404, 'No pending Consultations.')
    //res.status(404).json({ Message: 'No pending Consultations.' })
    SendResponse(res, 200, consultations)
    //res.status(200).json(consultations)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//New update consultation, added update photo (New)
router.patch('/id/:id', Auth(['Doctor', 'Patient']), upload(/\.(jpg|jpeg|PNG|png)$/).array('Photos', 3), TryCatch(async (req, res) => {
    let id = req.params.id
    let user = req.user
    let Data = req.body
    let updatedConsultation
    //try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        updatedConsultation = await updateConsultation(PatientQueryObj, Data, user.type)

        if (!(updatedConsultation instanceof Consultation))
            return SendResponseWithMessage(res, 403, `Update operation failed ${updatedConsultation}`)


        //Delete Photos 
        let toDelete = JSON.parse(req.body.toDelete)
        for (let index = 0; index < toDelete.length; index++) {
            let photo = await Photo.findByPk(toDelete[index])
            //console.log(photo);
            await Cloudinary.uploader.destroy(photo.public_id)

            const deletedPhoto = await Photo.destroy({ where: { id: photo.id } })
        }

        //Update Photos
        let toUpdate = JSON.parse(req.body.toUpdate)
        for (let index = 0; index < toUpdate.length; index++) {
            let photo = await Photo.findByPk(toUpdate[index])
            await Cloudinary.uploader.destroy(photo.public_id)

            const uploadResult = await Cloudinary.uploader.upload(req.files[index].path, {
                folder: 'ConsultationsPhotos',
                public_id: req.files[index].filename
            });

            const updateData = {
                originalname: req.files[index].originalname,
                filename: req.files[index].filename,
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id,
                width: uploadResult.width,
                height: uploadResult.height
            }
            const affectedRows = await Photo.update(updateData, {
                where: { id: photo.id, consultationId: updatedConsultation.id },
                returning: true,
                plain: true
            })
        }

        //Upload Rest Photo
        for (let index = toUpdate.length; index < req.files.length; index++) {
            const uploadResult = await Cloudinary.uploader.upload(req.files[index].path, {
                folder: 'ConsultationsPhotos',
                public_id: req.files[index].filename
            });
            const photo = new Photo(req.files[index])
            photo.url = uploadResult.secure_url
            photo.public_id = uploadResult.public_id
            photo.width = uploadResult.width
            photo.height = uploadResult.height
            photo.uploaderId = patientId
            photo.uploaderType = user.type
            photo.consultationId = updatedConsultation.id
            await photo.save()
        }


        let newPhotos = await Photo.findAll({
            where: { consultationId: updatedConsultation.id },
            attributes: PhotoInfo
        })
        let fullUpdatedsConsultation = new ConsultationObj(updatedConsultation, newPhotos)

        SendResponse(res, 200, fullUpdatedsConsultation)

    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        let DoctorQueryObj = { id, doctorId }
        updatedConsultation = await updateConsultation(DoctorQueryObj, Data, user.type)

        if (!(updatedConsultation instanceof Consultation))
            return SendResponseWithMessage(res, 403, `Update operation failed ${updatedConsultation}`)

        let newPhotos = await Photo.findAll({
            where: { consultationId: updatedConsultation.id },
            attributes: PhotoInfo
        })
        let fullUpdatedsConsultation = new ConsultationObj(updatedConsultation, newPhotos)

        let newConsultation = await Consultation.findOne({
            where: { id: updatedConsultation.id },
            include: [{
                model: Doctor,
                attributes: DoctorInfo
            }, {
                model: Patient,
                attributes: PatientInfo
            }]
        })
        let patientMessage = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            headings: { "en": "Afia Clinics" },
            contents: {
                "en": `Your consultation was answered.`
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
                    "value": `${newConsultation.patient.id}`
                }
            ],
            data: { "type": "consultation", "id": `${newConsultation.id}` }
        };
        pushNotification(patientMessage);

        SendResponse(res, 200, fullUpdatedsConsultation)

    }




})
)

//Delete consultation for user :Done
router.delete('/id/:id', Auth(['Admin', 'Doctor', 'Patient', 'Nurse']), TryCatch(async (req, res) => {
    let user = req.user
    let id = req.params.id
    let result
    // try {
    if (user.type === 'Admin' || user.type === 'Nurse') {
        let AdminQueryObj = { id }
        result = await deleteConsultations(AdminQueryObj)
    } else if (user.type === 'Doctor') {
        let doctorId = await getDoctorID(user)
        let DoctorQueryObj = { id, doctorId }
        result = await deleteConsultations(DoctorQueryObj)
    } else if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        result = await deleteConsultations(PatientQueryObj)
    }
    SendResponseWithMessage(res, 200, `${result} was delete`)
    //res.status(200).json({ DeleteResult: result })
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)



module.exports = router


/*



//Update consultation use by patient and doctor :Done
//Check update consultation from doctor side
router.patch('/id/:id', Auth(['Patient', 'Doctor']), TryCatch(async (req, res) => {
    let id = req.params.id
    let user = req.user
    let Data = req.body
    let result
    //try {
    if (user.type === 'Patient') {
        let patientId = await getPatientID(user)
        let PatientQueryObj = { id, patientId }
        result = await updateConsultation(PatientQueryObj, Data, user.type)
    } else if (user.type === 'Doctor') {
        let DoctorQueryObj = { id }
        result = await updateConsultation(DoctorQueryObj, Data, user.type)
    }

    //res.status(200).json({ UpdateResult: result })
    SendResponseWithMessage(res, 200, `${result} was updated`)
    // } catch (e) {
    //     res.status(403).send({ ErrorMessage: e.message })
    // }
}
))
*/