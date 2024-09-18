

const express = require('express');

const { authProtected } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', notificationController.allNotification);
router.get('/my-notifications', authProtected, notificationController.currUserNotification);
router.get('/mark-as-read/my-notifications', authProtected, notificationController.setMessagesRead);


module.exports = router;