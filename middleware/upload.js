const path = require('path')
const multer = require('multer')
const fs = require('fs')

let storage = multer.diskStorage({
    destination : function (req, file, cb){
        const destinationDir = `uploads/${req.body.username}/${req.body.createType}`;
        fs.mkdirSync(destinationDir, { recursive: true });
        cb(null, destinationDir);
    },
    filename: function (req, file, cb) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');
        const name = req.body.name;

        const filename = `${year}-${month}-${day}-${hours}${minutes}${seconds}-${name}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
})


let upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            console.log('file format not allowed')
            callback(null, false);
        }
    }
})

module.exports = upload