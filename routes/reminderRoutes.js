const express = require('express');

const { authProtected  } = require('../middlewares/auth');
const reminderController = require('../controllers/reminderController');
const { uploadSinglePhoto, resizeSinglePhoto } = require('../middlewares/multer');

const router = express.Router();

// 
router.post('/create-reminder', authProtected, reminderController.createReminder);
router.post('/reminder-img/:id', uploadSinglePhoto, resizeSinglePhoto, reminderController.uploadReminderImg);

router.get('/my-reminders', authProtected, reminderController.currUserReminder);
router.get('/every-reminder', reminderController.everyReminder);

router.patch('/update-my-reminder/:reminderID', authProtected, reminderController.updateReminder);
// router.patch('/postpone-reminder/:reminderID', authProtected, reminderController.postponeReminder);
router.patch('/mark-as-completed/:reminderID', authProtected, reminderController.markReminderAsCompleted);

router.patch('/add-gift/:reminderID', authProtected, reminderController.addGiftToReminder)

// i did it this way beacuse i was getting on weird body not defined error
router.patch('/postpone-reminder/:date/:time/:reminderID', authProtected, reminderController.postponeReminder);

router.patch('/cancel-reminder/:reminderID', authProtected, reminderController.cancelReminder);
router.delete('/delete-my-reminder/:reminderID', authProtected, reminderController.deleteReminder);


router.post('/current-reminder-for-sending', reminderController.checkCurrentReminders)


module.exports = router;