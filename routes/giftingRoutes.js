const express = require('express');

const { authProtected  } = require('../middlewares/auth');
const { uploadSinglePhoto, resizeSinglePhoto } = require('../middlewares/multer');
const giftingController = require('../controllers/giftingController');

const router = express.Router();


router.get('/', giftingController.getEveryGiftings);
router.get('/:giftingId', giftingController.getGiftingsById);

// CURRENT GIFTER
router.post('/create-gifting', authProtected, giftingController.createGiftings);
router.post('/gifting-img/:id', uploadSinglePhoto, resizeSinglePhoto, giftingController.uploadGiftingImg);

router.get('/my-giftings/bought', authProtected, giftingController.getMyGiftings);
router.patch('/update-my-giftings/:giftingId', authProtected, giftingController.updateGiftingById)
router.delete('/detele-my-giftings/:giftingId', authProtected, giftingController.deleteGiftingById)

router.post('/payment-verification/:reference/:charges', authProtected, giftingController.paymentWithCard)
router.post('/payment-wallet/', authProtected, giftingController.paymentWithWalletBal)

// GIFTING ORDER
router.get('/giftings-orders', authProtected, giftingController.myGiftingOrders);
router.get('/giftings-order/:giftingId', authProtected, giftingController.getMyGiftings);


module.exports = router;