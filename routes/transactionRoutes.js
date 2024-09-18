const express = require('express');

const transactionController = require('../controllers/transactionController');
const { authProtected, authProtectedAdmin, isRestricted } = require('../middlewares/auth');

const router = express.Router();


router.get('/', authProtectedAdmin, isRestricted, transactionController.allTransactions);
router.get('/:transactionID/:userId', authProtectedAdmin, isRestricted, transactionController.getUserTransactionById);
router.get('/my-transactions', authProtected, transactionController.allMyTransactions);
router.post('/payment-verification/:reference/:charges', authProtected, transactionController.walletDeposit)
router.post('/withdrawal-request', authProtected, transactionController.walletFundsWithdrawal)

router.patch('/withdrawal-approval/:id', authProtectedAdmin, isRestricted, transactionController.approvalWithdrawalRequest)

module.exports = router;