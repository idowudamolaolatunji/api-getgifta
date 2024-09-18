const express = require('express');

const subscriptionController = require('../controllers/subscriptionController');
const { authProtected } = require('../middlewares/auth');

const router = express.Router();

router.post('/subscribe-from-wallet', authProtected, subscriptionController.subscribeFromWallet);
router.post('/subscribe-from-card/:reference/:charges', authProtected, subscriptionController.subScribeFromCard);


module.exports = router;