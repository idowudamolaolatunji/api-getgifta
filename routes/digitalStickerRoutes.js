const express = require('express');

const digitalStickerController = require('../controllers/digitalStickerController');
const { isRestricted, authProtected } = require('../middlewares/auth');
const { uploadSinglePhoto, resizeSingleStickerPhoto } = require('../middlewares/multer');

const router = express.Router();

// router.get('/create-sticker', authProtected, isRestricted, digitalStickerController.createSticker)
router.post('/create-sticker', digitalStickerController.createSticker);
router.post('/upload-image/:id', uploadSinglePhoto, resizeSingleStickerPhoto, digitalStickerController.uploadImg);

router.patch('/update-sticker/:id', digitalStickerController.updateStickerById);
router.delete('/delete-sticker', digitalStickerController.deleteStickerById);

router.get('/get-stickers', digitalStickerController.getStickers);
router.get('/get-sticker/:id', digitalStickerController.getStickerById);


////////////////////////////////////////////////////
router.post('/purchase-sticker', authProtected, digitalStickerController.purchaseSticker);
router.get('/my-bought-stickers', authProtected, digitalStickerController.getMyBoughtStickers)
////////////////////////////////////////////////////
router.post('/gift-sticker/:itemId', authProtected, digitalStickerController.giftSticker);
router.get('/my-gift-stickers', authProtected, digitalStickerController.getMyGiftedStickers);


router.post('/redeem-gifted-sticker/:itemId', authProtected, digitalStickerController.redeemGiftedSticker);


module.exports = router;

