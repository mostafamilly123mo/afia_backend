const express = require('express')
const cors = require('cors')
const morgan = require("morgan")
const schedule = require('node-schedule');
const path = require('path');
const multer = require("multer");
const winston = require('winston');


const f = require('./utilities/WorkingDaysAnalyze')
const ErrorResponse = require('./middleware/Error/ErrorResponse')
let getDates = require('./utilities/GenerateDatesAndDays')
let getDayByDate = require('./utilities/GenerateDatesAndDays')
let { sendNews } = require('./utilities/SendCoronaNews')
const app = express()

process.on('uncaughtException', (e) => {
    console.log('We Got Uncaught Exception');
    winston.error(e.message)
    process.exit(1)
})

//winston.handelException(new winston.transports.File({filename: 'uncaughtExceptions.log'}))

process.on('unhandledRejection', (e) => {
    console.log('We Got Unhandled Rejection');
    winston.error(e.message)
    process.exit(1)
})

winston.configure({ transports: [new winston.transports.File({ filename: 'logfile.log' })] });

//Loading Models
// we can remove it but not now 
let db = require("./models");
let User = db.user;
let Doctor = db.doctor
let Calendar = db.calendar
let WorkingDay = db.workingday
let DoctorHoliday = db.doctorholiday
let DoctorDay = db.doctorday
let CenterHoliday = db.centerholiday


//Routes
const mainRoutes = require('./router/main')
const doctorsRoutes = require('./router/doctors')
const patientsRoutes = require('./router/patient')
const nursesRoutes = require('./router/nurse')
const adminsRoutes = require('./router/admin')
const appointmentsRoutes = require('./router/appointment')
const consultationsRoutes = require('./router/consultation')
const clinicRoutes = require('./router/clinic')
const centerRoutes = require('./router/center')
const sessionRoutes = require('./router/session')
const statisticRoutes = require('./router/statistics')
const reviewRoutes = require('./router/review')
const reportRoutes = require('./router/report')
const logRoutes = require('./router/log')

app.use(cors())
app.use(morgan('dev'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));



//Router
app.use('/api', mainRoutes)
app.use('/api/nurses', nursesRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/api/doctors', doctorsRoutes)
app.use('/api/patients', patientsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/consultations', consultationsRoutes)
app.use('/api/clinics', clinicRoutes)
app.use('/api/center', centerRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/statistics', statisticRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/log', logRoutes)
app.use('/', express.static(path.join(__dirname, '/')));

app.use(ErrorResponse)

const job = schedule.scheduleJob('42 * * * *', async function () {
    console.log('Here we are in cron job!');
    try {
        await f();
        await sendNews()

    } catch (e) {
        console.log(`Error in working days job + ${e}`)
    }
});





const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`Server up on port ${port}`)
})



/*//testing
app.post('/', async(req, res) => {

    try {

        await f();
        res.status(201).json('allworkingDays')
    } catch (e) {
        res.status(403).send('not work ' + e.message)
    }


})
app.get('/', async (req, res) => {

    try {
        let q = [1, 2]
        let s = [0, 4, 5]
        console.log(q.length);
        console.log(s[q.length]);
        //let dates = getDates(new Date(), (new Date()).addDays(5));
        // let day = getDayByDate()
        // console.log(day);
        res.status(201).json(s.length)
    } catch (e) {
        res.status(403).send(e.message)
    }


})


app.get('/', async (req, res) => {

    try {

        //let dates = getDates(new Date(), (new Date()).addDays(5));
        let day = getDayByDate()
        console.log(day);
        res.status(201).json(day)
    } catch (e) {
        res.status(403).send( e.message)
    }


})
*/