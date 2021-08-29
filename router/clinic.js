
const express = require('express')
const fs = require('fs')
let path = require('path');

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
let { ClinicObj } = require('../utilities/Classes')

//Helper function
const { getDoctorID } = require('../utilities/AppointmentHelperFunction');
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')

//Var
const ClinicInfo = ['id', 'name']
const PhotoInfo = ['id', 'originalname', 'url', 'clinicId', 'categoryId']

const router = express.Router()

//Admin: Create clinic :Done
router.post('/', Auth(['Admin']), TryCatch(async (req, res) => {
    const { error } = Clinic.validate(req.body)
    // if (error) return res.status(400).json({ ErrorMessage: error.details[0].message })
    if (error) return SendResponseWithMessage(res, 400, error.details[0].message)
    // {
    //     res.statusMessage = error.details[0].message
    //     res.status(400).end()
    // }
    const clinic = new Clinic(req.body)
    // try {
    await clinic.save()
    //res.status(201).json(clinic.getPublicData())
    SendResponse(res, 201, clinic.getPublicData())
    // } catch (e) {
    //     //res.status(403).json({ ErrorMessage: e.message })
    //     res.statusMessage = e.message
    //     res.status(403).end()

    // }
})
)
//Get all clinics :Done
router.get('/all', TryCatch(async (req, res) => {
    let clinics = new Array()
    //try {
    const allClinics = await Clinic.findAll(
        { attributes: ClinicInfo }
    )
    for (let index = 0; index < allClinics.length; index++) {
        let photo = await Photo.findOne({
            where: { clinicId: allClinics[index].id },
            attributes: PhotoInfo
        })
        let clinic = new ClinicObj(allClinics[index], photo)
        clinics.push(clinic)
    }
    SendResponse(res, 200, clinics)
    //res.status(200).json(clinics)
    // } catch (e) {
    //     res.status(403).json('An error occure while fetching data.' + e)
    // }
})
)

//Get Clinic By Id 
router.get('/id/:id', TryCatch(async (req, res) => {
    let id = req.params.id
    //try {
    let clinicData = await Clinic.findOne({
        where: { id },
        attributes: ClinicInfo
    })
    if (!clinicData)
        return SendResponseWithMessage(res, 404, 'No clinic with this id')
    //return res.status(404).json({ ErrorMessage: 'No clinic with this id' })
    let photo = await Photo.findOne({
        where: { clinicId: clinicData.id },
        attributes: PhotoInfo
    })
    let clinic = new ClinicObj(clinicData, photo)
    SendResponse(res, 200, clinic)
    //res.status(200).json(clinic)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)


//Clinics Photos Routes 
//Admin add clinic photo
router.post('/photo/id/:clinicId', Auth(['Admin']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    const clinicId = req.params.clinicId
    let user = req.user
    //let doctorId = await getDoctorID(user)

    if (!req.file) {
        return SendResponseWithMessage(res, 404, "Please upload a file!")
    } else {
        let isHavePhoto = await Photo.findOne({ where: { clinicId } })
        if (isHavePhoto != null) return res.status(403).json({ Message: 'You already have photo.' })
        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'ClinicsPhotos',
            public_id: req.file.filename
        });
        const photo = new Photo(req.file)
        photo.url = uploadResult.secure_url
        photo.public_id = uploadResult.public_id
        photo.width = uploadResult.width
        photo.height = uploadResult.height
        photo.uploaderId = user.id
        photo.uploaderType = 'Admin'
        photo.clinicId = clinicId
        await photo.save()
        SendResponse(res, 200, photo.getPublicData())
    }

})
)

//Get clinic photo
router.get('/photo/id/:clinicId', TryCatch(async (req, res) => {
    const clinicId = req.params.clinicId
    //try {
    let clinicPhoto = await Photo.findOne({
        where: { clinicId },
        attributes: PhotoInfo
    })
    if (clinicPhoto == null)
        return SendResponseWithMessage(res, 404, `Do not have a photo.`)
    //return res.status(404).json({ Message: `Do not have a photo.` })

    //res.status(200).json(clinicPhoto)
    SendResponse(res, 200, clinicPhoto)
    // } catch (e) {
    //     res.status(500).json({ message: ` ${e}`, });
    // }
})
)

//Admin update clinic photo
router.patch('/photo/id/:clinicId', Auth(['Admin']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    const clinicId = req.params.clinicId
    let user = req.user
    // try {
    let doctorId = await getDoctorID(user)
    if (!req.file) {
        return SendResponseWithMessage(res, 404, "Please upload a file!")
        //res.status(403).json({ message: "Please upload a file!" })
    } else {
        const clinicPhoto = await Photo.findOne({ where: { clinicId } })
        await Cloudinary.uploader.destroy(clinicPhoto.public_id)

        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'ClinicsPhotos',
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
            where: { clinicId },
            returning: true,
            plain: true
        })
        if (affectedRows[1] > 0) {
            let newPhoto = await Photo.findOne({
                where: { clinicId },
                attributes: PhotoInfo
            })
            return SendResponse(res, 200, newPhoto)
        }

        SendResponseWithMessage(res, 403, `Update operation failed`)
        //res.status(200).json({ message: `Update ${affectedRows[1]} file successfully ` })
    }
    // } catch (err) {
    //     res.status(500).json({ message: `Could not upload the file: . ${err}` });
    // }
})
)


//Delete clinic photo
router.delete('/photo/id/:clinicId', Auth(['Admin']), TryCatch(async (req, res) => {
    const clinicId = req.params.clinicId
    // try {

    const clinicPhoto = await Photo.findOne({ where: { clinicId } })
    if (clinicPhoto.url) {
        await Cloudinary.uploader.destroy(clinicPhoto.public_id)

    } else {
        res.status(403).json({ message: "No photo to deleted" })
    }

    const deletedPhoto = await Photo.destroy({ where: { clinicId } })
    // res.status(200).json({ message: `Deleted ${deletedPhoto} file successfully ` })
    SendResponseWithMessage(res, 200, `Deleted ${deletedPhoto} file successfully `)

    // } catch (err) {
    //     res.status(500).send({ message: `Could not delete the photo: . ${err}` });
    // }


})
)





module.exports = router