const express = require('express')
const fs = require('fs')
const multer = require("multer");
let moment = require('moment');

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



//const DoctorWorkingDays = db.doctorworkingdays

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
let { DoctorObj } = require('../utilities/Classes')

//Helper Function
const { getDoctorID } = require('../utilities/AppointmentHelperFunction');
const { SendResponse, SendResponseWithMessage } = require('../utilities/SendResponse')
const TryCatch = require('../middleware/Error/TryCatch')
let pushNotification = require('../utilities/PushNotification')
let { LogToDataBase } = require('../utilities/LogToDataBase')
const f = require('../utilities/WorkingDaysAnalyze')

//Var 
let UserInfo = ['id', 'username', 'email']
let DoctorInfo = ['id', 'firstName', 'lastName', 'phoneNumber',
    'description', 'sepecialize', 'language', 'clinicId']
let AppointmentInfo = ['id', 'day', 'date', 'startTime', 'endTime', 'type',
    'description', 'status', 'doctorId', 'patientId', 'sessionId', 'clinicId']
let PatientInfo = ['id', 'firstName', 'middleName', 'lastName', 'address',
    'phone', 'number', 'gender', 'length', 'weight', 'birthday']
let WorkDayInfo = ['id', 'day', 'startTime', 'endTime', 'doctorId']
let DoctorHolidayInfo = ['id', 'day', 'date', 'doctorId']
let PhotoInfo = ['id', 'originalname', 'url', 'doctorId', 'categoryId']
let TagInfo = ['id', 'check', 'review', 'consultation', 'doctorId']
let CenterDayInfo = ['id', 'day', 'openTime', 'closeTime']
let TodayDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
let Today = moment(TodayDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
const { Op } = require("sequelize");

const router = express.Router()

//Here: Main Operation For Doctor

//Post :Create doctor account by Admin 
router.post('/Signup', Auth(['Admin']), TryCatch(async (req, res) => {
    let userValidate = User.validate(req.body.user)
    //if (userValidate.error) return res.status(400).json({ ErrorMessage: userValidate.error.details[0].message })
    if (userValidate.error)
        return SendResponseWithMessage(res, 400, userValidate.error.details[0].message)

    // {
    //     res.statusMessage = userValidate.error.details[0].message
    //     res.status(400).end()
    // }

    let doctorValidate = Doctor.validate(req.body)
    //if (doctorValidate.error) return res.status(400).json({ ErrorMessage: doctorValidate.error.details[0].message })
    if (doctorValidate.error)
        return SendResponseWithMessage(res, 400, doctorValidate.error.details[0].message)
    // {
    //     res.statusMessage = doctorValidate.error.details[0].message
    //     res.status(400).end()
    // }

    let user = new User(req.body.user)
    let doctor = new Doctor(req.body)

    //try {
    await user.save()
    let token = User.generateAuthJWT(user)
    doctor.userId = user.id
    await doctor.save()

    let newDoctorMessage = {
        app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
        headings: { "en": "Afia Clinics" },
        contents: {
            "en": `Doctor ${doctor.firstName} ${doctor.lastName} join us.`
        },
        filters: [
            {
                "field": "tag",
                "key": "dest",
                "relation": "=",
                "value": "patient"
            }
        ],
        data: { "type": "doctor", "id": `${doctor.id}` }
    };
    pushNotification(newDoctorMessage);

    res.setHeader('Access-Control-Expose-Headers', "x-token")
    res.header('x-token', 'Bearer ' + token).status(201).json({ DoctorData: doctor.getPublicProfile(), MainData: user.getPublicProfile() })
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//Update Doctor Profile (Doctor) 
router.patch('/profile', Auth(['Doctor']), TryCatch(async (req, res) => {

    let updates = Object.keys(req.body)
    let NotAllowedUpdatesInDoctor = ['status', 'userId', 'clinicId']
    let isValid = updates.every((update) => !NotAllowedUpdatesInDoctor.includes(update))
    if (!isValid)
        return SendResponseWithMessage(res, 400, 'Invalid updates!')

    updates = Object.keys(req.body.user)
    let NotAllowedUpdatesInUser = ['username', 'password', 'type']
    isValid = updates.every((update) => !NotAllowedUpdatesInUser.includes(update))
    if (!isValid)
        return SendResponseWithMessage(res, 400, 'Invalid updates!')

    let user = req.user
    let id = await getDoctorID(user)
    const doctorUpdated = await Doctor.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })

    await user.update(req.body.user)

    let newDoctorData = await Doctor.findOne({
        where: { id },
        attributes: DoctorInfo,
        include: [{ model: User, attributes: UserInfo }]
    })

    if (!newDoctorData)
        return SendResponseWithMessage(res, 403, `Invalid id `)
    let photo = await Photo.findOne({
        where: { doctorId: newDoctorData.id },
        attributes: PhotoInfo
    })
    let tag = await Tag.findOne({
        where: { doctorId: newDoctorData.id },
        attributes: TagInfo
    })
    let doctor = new DoctorObj(newDoctorData, tag, photo)
    SendResponse(res, 200, doctor)

})
)

//Update Doctor Profile (Admin) 
router.patch('/profile/id/:doctorId', Auth(['Admin']), TryCatch(async (req, res) => {

    let id = req.params.doctorId
    let doctor = await Doctor.findOne({ where: { id } })
    if (!doctor) return SendResponseWithMessage(res, 404, 'Doctor profile not found.')
    let user = await User.findOne({ where: { id: doctor.userId } })

    let updates = Object.keys(req.body)
    let NotAllowedUpdatesInDoctor = ['userId']
    let isValid = updates.every((update) => !NotAllowedUpdatesInDoctor.includes(update))
    if (!isValid)
        return SendResponseWithMessage(res, 400, 'Invalid updates!')

    updates = Object.keys(req.body.user)
    let NotAllowedUpdatesInUser = ['type']
    isValid = updates.every((update) => !NotAllowedUpdatesInUser.includes(update))
    if (!isValid)
        return SendResponseWithMessage(res, 400, 'Invalid updates!')

    const doctorUpdated = await Doctor.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })

    await user.update(req.body.user)

    SendResponseWithMessage(res, 200, 'Doctor data updated.!')
})
)

//Get all doctors 
router.get('/all', TryCatch(async (req, res) => {
    let doctors = new Array()
    //try {
    const allDoctors = await Doctor.findAll({
        where: { status: true },
        attributes: DoctorInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    for (let index = 0; index < allDoctors.length; index++) {
        let photo = await Photo.findOne({
            where: { doctorId: allDoctors[index].id },
            attributes: PhotoInfo
        })
        let tag = await Tag.findOne({
            where: { doctorId: allDoctors[index].id },
            attributes: TagInfo
        })
        let doctor = new DoctorObj(allDoctors[index], tag, photo)
        doctors.push(doctor)
    }
    //res.status(200).json(doctors)
    SendResponse(res, 200, doctors)
    // } catch (e) {
    //     res.status(403).json({ message: `An error when fetching data ${e}` })
    // }
})
)

//Get doctor by id 
router.get('/id/:id', TryCatch(async (req, res) => {
    const id = req.params.id
    //try {
    const doctorData = await Doctor.findOne({
        where: { id },
        attributes: DoctorInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (!doctorData)
        // return res.status(403).json({ message: `Invalid id ` })
        return SendResponseWithMessage(res, 403, `Invalid id `)
    let photo = await Photo.findOne({
        where: { doctorId: doctorData.id },
        attributes: PhotoInfo
    })
    let tag = await Tag.findOne({
        where: { doctorId: doctorData.id },
        attributes: TagInfo
    })
    let doctor = new DoctorObj(doctorData, tag, photo)
    //res.status(200).json(doctor)
    SendResponse(res, 200, doctor)
    // } catch (e) {
    //     res.status(403).json({ message: e.message })
    // }
})
)

//Get all doctors in specific clinic  
router.get('/clinic/:clinicId', TryCatch(async (req, res) => {
    const clinicId = req.params.clinicId
    // try {
    let doctors = new Array()
    const clinicDoctors = await Doctor.findAll({
        where: { clinicId, status: true },
        attributes: DoctorInfo,
        include: [{ model: User, attributes: UserInfo }]
    })
    if (clinicDoctors.length == 0)
        //res.status(404).json({ ErrorMessage: 'No doctors work this clinic.!' })
        return SendResponseWithMessage(res, 404, 'No doctors work this clinic.!')

    for (let index = 0; index < clinicDoctors.length; index++) {
        let photo = await Photo.findOne({
            where: { doctorId: clinicDoctors[index].id },
            attributes: PhotoInfo
        })
        let tag = await Tag.findOne({
            where: { doctorId: clinicDoctors[index].id },
            attributes: TagInfo
        })
        let doctor = new DoctorObj(clinicDoctors[index], tag, photo)
        doctors.push(doctor)
    }
    //res.status(200).json(doctors)
    SendResponse(res, 200, doctors)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//Maybe needs to add delete route 

//Here:Doctor Tags 
//Add new tags 
router.post('/tags/id/:doctorId', Auth(['Admin']), TryCatch(async (req, res) => {

    let doctorId = req.params.doctorId
    let tag = await Tag.findOne({
        where: { doctorId },
        attributes: TagInfo
    })
    if (tag != null)
        return SendResponseWithMessage(res, 403, `You already ad your tags.`)
    tag = new Tag(req.body)
    tag.doctorId = doctorId
    await tag.save()

    SendResponse(res, 201, tag.getPublicData())

})
)

//Get doctor tags by id 
router.get('/tags/id/:id', TryCatch(async (req, res) => {
    let doctorId = req.params.id
    // try {
    let tag = await Tag.findOne({
        where: { doctorId },
        attributes: TagInfo
    })
    if (!tag) return SendResponseWithMessage(res, 404, 'There are no const time.')
    SendResponse(res, 201, tag)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)

//Update doctor tags
router.patch('/tags/id/:doctorId', Auth(['Admin']), TryCatch(async (req, res) => {

    let doctorId = req.params.doctorId

    let affectedRows = await Tag.update(req.body, {
        where: { doctorId },
        returning: true,
        plain: true
    })

    if (affectedRows[1] > 0) {
        let updatedTag = await Tag.findOne({
            where: { doctorId },
            attributes: TagInfo
        })
        return SendResponse(res, 200, updatedTag)
    }
    SendResponseWithMessage(res, 403, `Update operation failed`)

})
)

//Here:Doctor Photo Routers 
//Add doctor photo
router.post('/photo', Auth(['Doctor', 'Admin']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let doctorId = await getDoctorID(user)
    if (!req.file) {
        return SendResponseWithMessage(res, 403, "Please upload a profile photo!")
        //res.status(403).json({ message: "Please upload a profile photo!" })
    } else {
        let isHavePhoto = await Photo.findOne({ where: { doctorId } })
        if (isHavePhoto != null) return SendResponseWithMessage(res, 404, 'You already have photo.')
        //return res.status(403).json({ Message: 'You already have photo.' })
        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'DoctorsPhotos',
            public_id: req.file.filename
        });
        const photo = new Photo(req.file)
        photo.url = uploadResult.secure_url
        photo.public_id = uploadResult.public_id
        photo.width = uploadResult.width
        photo.height = uploadResult.height
        photo.uploaderId = doctorId
        photo.uploaderType = 'Doctor'
        photo.doctorId = doctorId
        await photo.save()
        SendResponse(res, 201, photo.getPublicData())
        //res.status(201).json(photo.getPublicData())
    }
    // } catch (err) {
    //     // if (err instanceof multer.MulterError) {
    //     //     res.status(400).send({ err: 'File not supported!' });}
    //     res.status(500).json({ message: 'Could not upload the file: . ' + e.message });

    // }
})
)

//Get my(doctor) photo
router.get('/photo', Auth(['Doctor', 'Admin']), TryCatch(async (req, res) => {
    let user = req.user
    // try {
    let doctorId = await getDoctorID(user)
    let doctorPhoto = await Photo.findOne({
        where: { doctorId },
        attributes: PhotoInfo
    })
    if (!doctorPhoto)
        return SendResponseWithMessage(res, 404, `Do not have a photo.`)
    //return res.status(404).json({ Message: `Do not have a photo.` })
    //res.status(200).json(doctorPhoto)
    SendResponse(res, 200, doctorPhoto)
    // } catch (e) {
    //     res.status(500).json({ message: ` ${e}`, });
    // }
})
)

//Get doctor photo by id 
router.get('/photo/id/:doctorId', TryCatch(async (req, res) => {
    const doctorId = req.params.doctorId
    try {
        const doctorPhoto = await Photo.findOne({
            where: { doctorId },
            attributes: PhotoInfo
        })
        if (!doctorPhoto)
            return SendResponseWithMessage(res, 404, `Do not have a photo.`)
        //return res.status(404).json({ Message: `Do not have a photo.` })
        SendResponse(res, 200, doctorPhoto)
        //res.status(200).json(doctorPhoto)

    } catch (e) {
        res.status(500).json({ message: ` ${e}`, });
    }
})
)

//Update doctor photo 
router.patch('/photo', Auth(['Doctor', 'Admin']), upload(/\.(jpg|jpeg|PNG|png)$/).single('Photo'), TryCatch(async (req, res) => {
    let user = req.user
    // try {
    let doctorId = await getDoctorID(user)
    if (!req.file) {
        return SendResponseWithMessage(res, 403, "Please upload a profile photo!")
        //res.status(403).json({ message: "Please upload a profile photo!" })
    } else {
        const doctorPhoto = await Photo.findOne({ where: { doctorId } })
        await Cloudinary.uploader.destroy(doctorPhoto.public_id)

        const uploadResult = await Cloudinary.uploader.upload(req.file.path, {
            folder: 'DoctorsPhotos',
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
            where: { doctorId },
            returning: true,
            plain: true
        })
        if (affectedRows[1] > 0) {
            let newPhoto = await Photo.findOne({
                where: { doctorId },
                attributes: PhotoInfo
            })
            return SendResponse(res, 200, newPhoto)
        }

        SendResponseWithMessage(res, 403, `Update operation failed`)
    }
    // } catch (err) {
    //     res.status(500).json({ message: `Could not upload the file: . ${err}` });
    // }
})
)

//Delete doctor photo
router.delete('/photo', Auth(['Doctor', 'Admin']), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let doctorId = await getDoctorID(user)
    const doctorPhoto = await Photo.findOne({ where: { doctorId } })

    if (doctorPhoto.url) {
        await Cloudinary.uploader.destroy(doctorPhoto.public_id)

    } else {
        // res.status(403).json({ message: "No photo to deleted" })
        SendResponseWithMessage(res, 403, "No photo to deleted")
    }

    const deletedPhoto = await Photo.destroy({ where: { doctorId } })
    SendResponseWithMessage(res, 200, `Deleted ${deletedPhoto} file successfully `)
    //res.status(200).json({ message: `Deleted ${deletedPhoto} file successfully ` })

    // } catch (err) {
    //     res.status(500).send({ message: `Could not delete the photo: . ${err}` });
    // }
})
)


//Here:Doctor Working Days In General Routers , We Will Add Data To Doctor Days Table 

//add time validate 
//Add doctor working days :Admin:Done 
router.post('/work_days', Auth(['Admin']), TryCatch(async (req, res) => {
    //let user = req.user
    let day = req.body.day
    const { error } = DoctorDay.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)

    let centerDay = await CenterDay.findOne({
        where: { day },
        attributes: CenterDayInfo
    })
    if (!centerDay)
        return SendResponseWithMessage(res, 403, 'The center does not Work in this day.')

    if (!(req.body.startTime >= centerDay.openTime && req.body.endTime <= centerDay.closeTime))
        return SendResponseWithMessage(res, 403, 'Please check time is valid for center work time.')


    let doctorDay = new DoctorDay(req.body)
    doctorDay.centerDayId = centerDay.id
    await doctorDay.save()
    //To update working day table.
    await f();

    SendResponse(res, 200, doctorDay.getPublicData())

})
)

//Get working day for specific doctor by id :Admin:Done 
router.get('/work_days/id/:id', TryCatch(async (req, res) => {
    let doctorId = req.params.id
    //try {
    let days = await DoctorDay.findAll({
        where: { doctorId, inWork: true },
        attributes: WorkDayInfo
    })
    if (days.length == 0)
        return SendResponseWithMessage(res, 404, 'This doctor have not working day.')
    //return res.status(404).json({ Message: 'This doctor have not working day.' })

    //res.status(200).json(days)
    SendResponse(res, 200, days)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)

//Get all doctor in one day :Admin :Done
// is not a function .getPublicData()
router.get('/work_days/day/:day', TryCatch(async (req, res) => {
    let day = req.params.day

    let doctorsInDay = await DoctorDay.findAll({
        where: { day },
        attributes: ['doctorId']
    })
    SendResponse(res, 200, doctorsInDay)

})
)

//Update doctor work day :Admin:Done
router.patch('/work_days/id/:id/day/:day/workingDayId/:workingDayId', Auth(['Admin']), TryCatch(async (req, res) => {
    let doctorId = req.params.id
    let day = req.params.day
    let id = req.params.workingDayId
    //try {
    let centerDay = await CenterDay.findOne({ where: { day } })
    if (!centerDay)
        return SendResponseWithMessage(res, 403, 'The center does not Work in this day.')
    if (!(req.body.startTime >= centerDay.openTime && req.body.endTime <= centerDay.closeTime))
        return SendResponseWithMessage(res, 403, 'Please check time is valid for center work time.')
    let affectedRows = await DoctorDay.update(req.body, {
        where: { day, doctorId, id },
        returning: true,
        plain: true
    })
    SendResponseWithMessage(res, 200, `${affectedRows[1]} was updated successfully`)

})
)

//Delete doctor work day :Admin:Done
router.delete('/work_days/doctorId/:id/workingDayId/:workingDayId', Auth(['Admin']), TryCatch(async (req, res) => {
    let doctorId = req.params.id
    let id = req.params.workingDayId
    let workTime = await DoctorDay.findByPk(id)
    console.log(id);

    let affectedRows = await DoctorDay.destroy({ where: { id, doctorId } })
    if (affectedRows == 0)
        return SendResponseWithMessage(res, 403, 'Sorry no doctor working day to delete')

    //To update working day table.
    await f();

    //delete appointments after delete doctor workday 
    let appointments = await Appointment.findAll({
        where: {
            doctorId, date: { [Op.gte]: Today }, day: workTime.day,
            [Op.or]: [{ status: 'Accepted' }, { status: 'Pending' }],
            [Op.and]: [{ startTime: { [Op.gte]: workTime.startTime } }
                , { endTime: { [Op.lte]: workTime.endTime } }]
        },
        attributes: AppointmentInfo,
        include: [{
            model: Doctor,
            attributes: DoctorInfo
        }, {
            model: Patient,
            attributes: PatientInfo
        }]
    })

    for (let index = 0; index < appointments.length; index++) {

        appointments[index].status = 'Rejected'
        await appointments[index].save()
        console.log(`${appointments[index].doctor.firstName}`);
        let patientMessage = {
            app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
            headings: { "en": "Afia Clinics" },
            contents: {
                "en": `Your Appointment with Dr.${appointments[index].doctor.firstName} ${appointments[index].doctor.lastName} has been ${appointments[index].status}`
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
                    "value": `${appointments[index].patient.id}`
                }
            ],
            data: { "type": "appointment", "id": `${appointments[index].id}` }
        };
        pushNotification(patientMessage);


    }



    SendResponseWithMessage(res, 200, `${affectedRows} was deleted successfully.`)

})
)

//Here:Doctor Holidays Routers , We Will Add Data To Doctor Holidays Table 


//Create Holiday >>>
router.post('/holidays', Auth(['Admin']), TryCatch(async (req, res) => {

    const { error } = DoctorHoliday.validate(req.body)
    if (error)
        return SendResponseWithMessage(res, 400, error.details[0].message)

    let { day, date, doctorId } = req.body
    let isFound = await DoctorHoliday.findOne({
        where: { day, date, doctorId }
    })

    if (isFound) return SendResponseWithMessage(res, 403, 'You already set holiday')

    let holiday = new DoctorHoliday(req.body)
    await holiday.save()

    //To update working day table.
    await f();

    let affected = await WorkingDay.destroy({
        where: {
            date: holiday.date,
            doctorId: holiday.doctorId
        }
    })
    SendResponse(res, 200, holiday.getPublicData())

})
)

//Get all holidays for all doctor 
router.get('/holidays', TryCatch(async (req, res) => {
    let holidays = await DoctorHoliday.findAll({
        attributes: DoctorHolidayInfo
    })
    if (holidays.length == 0)
        return SendResponseWithMessage(res, 404, 'No doctor holidays')

    SendResponse(res, 200, holidays)
})
)

//Get all holidays for specific doctor 
router.get('/holidays/id/:doctorId', Auth(['Admin', 'Nurse']), TryCatch(async (req, res) => {

    let doctorId = req.params.doctorId

    let holidays = await DoctorHoliday.findAll({
        where: { doctorId },
        attributes: DoctorHolidayInfo
    })
    if (holidays.length == 0)
        return SendResponseWithMessage(res, 404, 'No doctor holidays')

    SendResponse(res, 200, holidays)
})
)

//Update holiday by id
router.patch('/holidays/id/:id', Auth(['Admin']), TryCatch(async (req, res) => {
    let id = req.params.id
    //try {
    let affectedRows = await DoctorHoliday.update(req.body, {
        where: { id },
        returning: true,
        plain: true
    })
    if (affectedRows[1] == 0)
        return SendResponseWithMessage(res, 403, 'An error occur when updateing doctor day')
    //return res.status(403).json({ Message: 'An error occur when updateing doctor day' })
    else
        //res.status(200).json({ UpdateResult: `Update Done` })
        SendResponseWithMessage(res, 200, `Update Done`)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }

})
)

//Delete Holiday by id 
router.delete('/holidays/id/:id', Auth(["Admin"]), TryCatch(async (req, res) => {
    let id = req.params.id
    let holiday = await DoctorHoliday.findOne({
        where: { id }
    })
    if (!holiday) {
        SendResponseWithMessage(res, 404, "There are no holiday with this id.")
    }
    let affectedRows = await DoctorHoliday.destroy({ where: { id } })

    //To update working day table.
    await f();

    SendResponseWithMessage(res, 200, "holiday deleted successfully")
}))

//Special Route
//Here we will get data from working day table and send it to front ...
router.get('/working_days/id/:doctorId', TryCatch(async (req, res) => {
    let doctorId = req.params.doctorId
    //try {
    let doctorWorkindDays = await WorkingDay.findAll({
        where: { doctorId },
        attributes: ['id', 'day', 'date', 'startTime', 'endTime']
    })
    if (doctorWorkindDays.length == 0)
        return SendResponseWithMessage(res, 404, `No working days for this doctor`)

    SendResponse(res, 200, doctorWorkindDays)

})
)

module.exports = router




/*






//Add doctor photo
// router.post('/photo', Auth(['Doctor', 'Admin']), upload('uploads/DoctorsPhotos', /\.(jpg|jpeg|PNG|png)$/).single('Photo'), async (req, res) => {
//     let user = req.user
//     try {
//         let doctorId = await getDoctorID(user)
//         if (!req.file) {
//             res.status(403).json({ message: "Please upload a profile photo!" })
//         } else {
//             const photo = new Photo(req.file)
//             photo.uploaderId = doctorId
//             photo.uploaderType = 'Doctor'
//             photo.doctorId = doctorId
//             await photo.save()
//             res.status(201).json(photo.getPublicData())
//         }
//     } catch (err) {
//         res.status(500).json({ message: `Could not upload the file: . ${err}` });
//     }
// });

//Delete doctor photo
router.delete('/photo', Auth(['Doctor', 'Admin']), async (req, res) => {
    let user = req.user
    try {
        let doctorId = await getDoctorID(user)
        const doctorPhoto = await Photo.findOne({ where: { doctorId } })
        if (doctorPhoto.path) {
            fs.unlink(doctorPhoto.path, (err) => {
                if (err) throw err
                console.log('File deleted!');
            });
        } else {
            res.status(403).json({ message: "No photo to deleted" })
        }

        const deletedPhoto = await Photo.destroy({ where: { doctorId } })
        res.status(200).json({ message: `Deleted ${deletedPhoto} file successfully ` })

    } catch (err) {
        res.status(500).send({ message: `Could not delete the photo: . ${err}` });
    }
});

//Get doctor tags
router.get('/tags', Auth(['Doctor']), TryCatch(async (req, res) => {
    let user = req.user
    //try {
    let doctorId = await getDoctorID(user)
    let tag = await Tag.findOne({
        where: { doctorId },
        attributes: TagInfo
    })
    if (!tag)
        return SendResponseWithMessage(res, 404, 'There are no const time.')
    // res.status(404).json({ Message: 'There are no const time.' })
    //res.status(201).json(tag)
    SendResponse(res, 201, tag)
    // } catch (e) {
    //     res.status(403).json({ ErrorMessage: e.message })
    // }
})
)
*/