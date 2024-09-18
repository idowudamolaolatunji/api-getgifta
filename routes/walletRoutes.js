const express = require('express');

const transactionController = require('../controllers/transactionController');
const { authProtected, authProtectedAdmin, isRestricted } = require('../middlewares/auth');
const router = express.Router();


router.get('/', authProtected, transactionController.getWallet);
router.get('/profit', authProtectedAdmin, isRestricted, transactionController.giftaProfit);


module.exports = router;