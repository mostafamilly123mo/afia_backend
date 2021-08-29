const multer = require("multer");
const winston = require("winston");

module.exports = function (error, req, res, next) {
    //Log the exception
    winston.error(error.message)
    //Check Multer Error
    if (error instanceof multer.MulterError) {
        console.log("Multer  Error:" + error.message);
        res.statusMessage = error.message
        return res.status(500).end()
    }
    //Check Rest Error
    //res.statusMessage = error.message
    res.statusMessage = JSON.stringify(error.message)
    res.status(500).json({ ErrorMessage: error.message })
    res.end()
    //res.status(500).json({ ErrorMessage: err.message })
}