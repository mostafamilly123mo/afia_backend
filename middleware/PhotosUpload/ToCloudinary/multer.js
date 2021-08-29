
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const path = require("path");

// Multer config

module.exports = function (regex) {
    let storage = multer.diskStorage({
        filename: (req, file, cb) => {
            console.log(file.originalname);
            cb(null, Date.now() + '-' + file.originalname);
        },
    });

    let fileFilter = function (req, file, cb) {
        //regex for jpg,jpeg,png using file.originalname ..
        //.endsWith('.pdf'))
        if (!file.originalname.match(regex)) {
            return cb(new Error('Please upload a Photo'))
        }
        cb(undefined, true)
    }

    let uploadPhoto = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter: fileFilter
    })

    return uploadPhoto
}


// module.exports = function(destination, regex) {
//     let storage = multer.diskStorage({
//         destination: (req, file, cb) => {
//             cb(null, destination);
//         },
//         filename: (req, file, cb) => {
//             console.log(file.originalname);
//             cb(null, Date.now() + '-' + file.originalname);
//         },
//     });

//     let uploadFile = multer({
//         storage: storage,
//         limits: { fileSize: maxSize },
//         fileFilter(req, file, cb) {
//             //regex for jpg,jpeg,png using file.originalname ..
//             //.endsWith('.pdf'))
//             if (!file.originalname.match(regex)) {
//                 return cb(new Error('Please upload a Photo'))
//             }

//             cb(undefined, true)

//         }
//     })
//     return uploadFile

// }

/*

module.exports = multer({
    storage: multer.diskStorage({
        filename: (req, file, cb) => {
            console.log(file.originalname);
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    fileFilter(req, file, cb) {
        //regex for jpg,jpeg,png using file.originalname ..
        //.endsWith('.pdf'))
        if (!file.originalname.match(regex)) {
            return cb(new Error('Please upload a Photo'))
        }

        cb(undefined, true)

    }
}
); */
