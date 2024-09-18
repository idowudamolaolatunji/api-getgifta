const express = require('express');

const { authProtected  } = require('../middlewares/auth');
const wishListController = require('../controllers/wishListController');
const { uploadSinglePhoto, resizeSinglePhoto } = require('../middlewares/multer');

const router = express.Router();

// 
router.get('/', wishListController.geteveryWishlist);
router.get('/:wishlistID', wishListController.getWishlistById);
router.get('/shared-wishlist/:sharedUrl', wishListController.getSharedWishlist);
router.get('/all-wishes/:wishListID', wishListController.getWishesByWishListId);
// router.post('/', authProtected, )

router.post('/create-wishlist', authProtected, wishListController.createWishList);
router.post('/wishlist-img/:id', uploadSinglePhoto, resizeSinglePhoto, wishListController.uploadWishlistImg);

router.post('/create-wish/:wishlistID', authProtected, wishListController.createWishes);
router.get('/user-wishlists/wishlists', authProtected, wishListController.getMyWishlists);
router.get('/user-wishlists/wishlists/:wishlistSlug', authProtected, wishListController.getWishlistBySlug);

router.patch('/update-my-wishlist/:wishListID', authProtected, wishListController.updateWishList);
router.delete('/delete-my-wishlist/:wishListID', authProtected, wishListController.deleteWishList);

router.patch('/update-wish/:wishListID/:wishID', authProtected, wishListController.updateWish);
router.delete('/delete-wish/:wishListID/:wishID', authProtected, wishListController.deleteWish);

router.post('/payment-verification/:reference/:charges', wishListController.payForWish);

router.get('/wishlist-log/logs/:wishListId', authProtected, wishListController.getAllCurrUserWishListPaymentLogs);
router.get('/wish-log/logs/:wishId', authProtected, wishListController.getAllCurrUserWishPaymentLogs);
router.post('/wish-log/response', authProtected, wishListController.respondMessageToPaymentLog);


module.exports = router;