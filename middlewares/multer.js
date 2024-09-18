const fs = require('fs')

const multer = require('multer');
const sharp = require('sharp');
////////////////////////////////////////////
const multerStorage = multer.memoryStorage();

// create a multer filter
const multerFilter = (req, file, cb) => {
    try {
        if (file.mimetype.startsWith('image') || file.mimetype.startsWith('application/pdf')) {
            cb(null, true);
        } else {
            throw new Error('Not a Vaild file! Please upload only accepted files');
        }
    } catch (error) {
        cb(error, false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});


// SINGLE IMAGE UPLOAD
exports.uploadSinglePhoto = upload.single('image');

// MULTIPLE KYC IMAGE UPLOADS
exports.uploadMultipleKYCPhoto = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'frontimage', maxCount: 1 },
    { name: 'backimage', maxCount: 1  },
    { name: 'utilityBill', maxCount: 1, accept: '*' },
    { name: 'acctStatement', maxCount: 1, accept: '*' },
]);

// KYC PDF OR ANY FILE 
// exports.uploadAnyFile = upload.any();

// MULTIPLE PRODUXCT IMAGE UPLOADS
exports.uploadMultipleProductPhoto = upload.array('images', 6);


exports.resizeSinglePhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `others-${req.params.id}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/asset/others/${req.file.filename}`);
        next();

    } catch(err) {
        next(err)
    }
};

exports.resizeSingleItemPhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `others-${req.params.id}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(500, 350)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/asset/others/${req.file.filename}`);
        next();

    } catch(err) {
        next(err)
    }
};


exports.resizeSingleStickerPhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `stickers-${req.params.id}-${Date.now()}.png`;

        await sharp(req.file.buffer)
            .resize(350, 350)
            .toFormat('png')
            .png({ quality: 95 })
            .toFile(`public/asset/stickers/${req.file.filename}`);
        next();

    } catch(err) {
        next(err)
    }
};


exports.resizeProfilePhoto = async function (req, res, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(250, 250)
            .toFormat('jpeg')
            .jpeg({ quality: 60 })
            .toFile(`public/asset/users/${req.file.filename}`);
        next();

    } catch(err) {
        next(err);
    }
};


// exports.resizeProductPhotos = async function (req, res, next) {
//     console.log(req.files)
//     if(!req.files.images) return next();
//     try {
//         const productId = req.params.id;

//         if (req.files.images && Array.isArray(req.files.images)) {
//             for (const image of req.files.images) {
//                 const fileName = `product-${productId}-${Date.now()}-${req.files.images.indexOf(image) + 1}.jpeg`
//                 await sharp(image.buffer)
//                 .resize(750, 750)
//                 .toFormat('jpeg')
//                 .jpeg({ quality: 80 })
//                 .toFile(`public/asset/products/${fileName}`);
//                 req.files.images.filenames.push(fileName);
//             }
//         }
//         next();

//     } catch(err) {
//         next(err);
//     }
// };


exports.resizeDocPhotos = async function (req, res, next) {
    if(!req.files.image || !req.files.frontimage || !req.files.backimage || (!req.files.utilityBill || !req.files.acctStatement)) return next();

    try {
        const docId = req.params.id;

        // USER IMAGE
        const userImageFileName = `kyc-${docId}-${Date.now()}-main.jpeg`;
        await sharp(req.files.image[0].buffer)
            .resize(400, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/asset/kycs/${userImageFileName}`)
        ;
        req.files.image.filename = userImageFileName;


        // FRONT IMAGE
        const frontImgFileName = `kyc-${docId}-${Date.now()}-front.jpeg`;
        await sharp(req.files.frontimage[0].buffer)
            .resize(750, 400)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`public/asset/kycs/${frontImgFileName}`)
        ;
        req.files.frontimage.filename = frontImgFileName;


        // BACK IMAGE
        const backImgFileName = `kyc-${docId}-${Date.now()}-back.jpeg`;
        await sharp(req.files.backimage[0].buffer)
            .resize(750, 400)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`public/asset/kycs/${backImgFileName}`)
        ;
        req.files.backimage.filename = backImgFileName;


        // const utilBillFileName = `kyc-${docId}-${Date.now()}-utility-bill.${req.files.utilityBill[0].originalname.split('.').pop()}`;
        const utilBillFileName = `kyc-${docId}-${Date.now()}-utility-bill${req.files.acctStatement[0].originalname.split('.').pop() === 'pdf' ? '.pdf' : '.jpeg' }`;
        if (req.files.utilityBill[0].mimetype.startsWith('image/')) {
            await sharp(req.files.utilityBill[0].buffer)
            .resize(750, 400)
            .toFormat('jpeg')
            .jpeg({ quality: 85 })
            .toFile(`public/asset/kycs/${utilBillFileName}`);
        } else {
            await fs.writeFile(`public/asset/kycs/${utilBillFileName}`, req.files.utilityBill[0].buffer, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`File written successfully`);
                }
            });
        }
        req.files.utilityBill.filename = utilBillFileName;


        // ACCT STATEMENT
        const acctStatementFileName = `kyc-${docId}-${Date.now()}-acct-statement${req.files.acctStatement[0].originalname.split('.').pop() === 'pdf' ? '.pdf' : '.jpeg' }`;
        if (req.files.acctStatement[0].mimetype.startsWith('image/')) {
            await sharp(req.files.acctStatement[0].buffer)
                .resize(750, 400)
                .toFormat('jpeg')
                .jpeg({ quality: 85 })
                .toFile(`public/asset/kycs/${acctStatementFileName}`);
        } else {
            await fs.writeFile(`public/asset/kycs/${acctStatementFileName}`, req.files.acctStatement[0].buffer, (err) => {
                if (err) {
                console.error(err);
                } else {
                console.log(`File written successfully`);
                }
            });
        }
        req.files.acctStatement.filename = acctStatementFileName;

        next()
    } catch(err) {
        next(err);
    }
}