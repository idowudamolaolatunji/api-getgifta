const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authProtected, authProtectedAdmin, isRestricted } = require('../middlewares/auth');
const { uploadSinglePhoto, resizeProfilePhoto } = require('../middlewares/multer');

const router = express.Router();


// USER AUTHS
router.post('/signup-vendor', authController.vendorCreation);
router.post('/signup', authController.userSignup);
router.post('/signup/:referralCode', authController.userSignup);
router.post('/verify-otp', authController.verifyOtp);
router.post('/request-otp', authController.requestOtp);
router.post('/login', authController.userLogin);
router.get('/logout', authController.logout);

// USER DOCUMENTS
// router.get('/', userController.getAllUser);
router.get('/', authProtectedAdmin, isRestricted, userController.getAllUser);
router.get('/:userID', authProtectedAdmin, isRestricted, userController.getUser);
router.patch('/:userID', userController.updateUser);
router.delete('/:userID', userController.deleteUser);

// ADMIN LOGIN
router.post('/admin-login', authController.adminLogin)

router.post('/create-admin', authProtectedAdmin, isRestricted, authController.adminCreation)
router.post('/create-vendor', authProtectedAdmin, isRestricted, authController.vendorCreation)

router.patch('/pushtoken', authProtected, authController.updatePushToken);
router.patch('/role/become-vendor', authProtected, userController.becomeaVendor);

// CURRENT USER DOCUMENT
// router.patch('/me/update-profile-photo/:id',  uploadSinglePhoto, resizeProfilePhoto, userController.uploadProfilePicture);
router.patch('/me/update-profile-photo', authProtected, uploadSinglePhoto, resizeProfilePhoto, userController.uploadProfilePicture);

router.patch('/me/update-profile', authProtected, userController.updateMe);
router.delete('/me/delete-account', authProtected, userController.deleteAccount);

// UPDATE PASSWORD
router.patch('/me/update-password', authProtected, authController.updatePassword)


// FORGOT PASSWORD AND PASSWORD RESET
router.post('/forgot-password', authController.forgotPassword)
router.get('/reset-password', authController.updatePassword)


module.exports = router;
