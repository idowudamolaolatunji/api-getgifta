const express = require('express');

const { authProtected, isRestricted, authProtectedAdmin } = require('../middlewares/auth')
const kycController = require('../controllers/kycController');
const { uploadMultipleKYCPhoto, resizeDocPhotos } = require('../middlewares/multer');

const router = express.Router();


router.post('/upload-kyc-docs', authProtected, kycController.submitKycDoc);
router.post('/upload-kyc-img/:id', uploadMultipleKYCPhoto, resizeDocPhotos, kycController.uploadKycImages)


router.get('/', authProtectedAdmin, isRestricted, kycController.getAllKyc);
// router.get('/', kycController.getAllKyc);
router.get('/:id', kycController.getUserKycById);
router.get('/user/my-kyc', authProtected, kycController.getMyKycDoc);


router.patch('/approve-kyc/:userId/:docId', authProtectedAdmin, isRestricted, kycController.approveKycDoc);
router.patch('/reject-kyc/:userId/:docId', authProtectedAdmin, isRestricted, kycController.rejectKycDoc);

module.exports = router;