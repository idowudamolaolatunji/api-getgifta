const express = require('express');

const { authProtected } = require('../middlewares/auth');
const digitalGiftController = require('../controllers/digitalGiftController');
const { uploadSinglePhoto, resizeSinglePhoto, resizeSingleItemPhoto } = require('../middlewares/multer');

const router = express.Router();

// GIFT CATEGORIES
router.post('/create-category', digitalGiftController.createDigitalGiftCategory);
router.get('/all-category', digitalGiftController.getAllCategories);

// Digital GIFTs
router.post('/create-digital-gift', authProtected, digitalGiftController.createDigitalGift);
router.post('/digital-gift-img/:id', uploadSinglePhoto, resizeSingleItemPhoto, digitalGiftController.uploadImg);

//PURCHASE DIGITAL ITEM
router.post('/purchase-digital-gift/:productId', authProtected, digitalGiftController.purchaseDigitalItem);

router.get('/digital-gifts', digitalGiftController.getAllDigitalGifts);

router.get('/digital-gifts/:id', digitalGiftController.getDigitalGiftById);
router.get('/digital-gifts/category/:category', authProtected, digitalGiftController.getDigitalGiftsByCategories);


// CURRENT User Digital GIFTs
router.get('/my-purchased-items', authProtected, digitalGiftController.allMyPurchasedDigitalItems);
router.get('/my-purchased-items-by-category/:category', authProtected, digitalGiftController.allMyPurchasedItemByCategory);
router.get('/codes/:digitalGiftId/:boughtItemId', authProtected, digitalGiftController.getCodes);

router.patch('/update-my-digital-gift/:id', authProtected, digitalGiftController.updateDigitalGifts);
router.delete('/delete-my-digital-gift/:id', authProtected, digitalGiftController.deleteDigitalGift);


module.exports = router;