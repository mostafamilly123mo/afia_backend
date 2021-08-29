
//Loading Models 
const db = require("../models");

let Log = db.log

let LogToDataBase = async function (message, date, type, userId) {

    let LogObject = new Object();
    LogObject.message = message
    LogObject.date = date;
    LogObject.type = type;
    LogObject.userId = userId
    let log = new Log(LogObject)
    await log.save()
}

module.exports = { LogToDataBase }