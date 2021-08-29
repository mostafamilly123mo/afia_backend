
let SendResponse = function (res, code, obj) {
    res.status(code).json(obj)
}

let SendResponseWithMessage = function (res, code, message) {
    res.statusMessage = message
    res.status(code).json({ ErrorMessage: message }).end()
}

module.exports = { SendResponse, SendResponseWithMessage }