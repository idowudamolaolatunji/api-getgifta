const express = require('express');

const { authProtected } = require('../middlewares/auth');
const giftProductController = require('../controllers/giftProductController');
const { uploadMultipleProductPhoto, resizeProductPhotos } = require('../middlewares/multer');

const router = express.Router();

// GIFT CATEGORIES
router.post('/create-category', giftProductController.createCategory);
router.get('/all-category', giftProductController.getAllCategories);

// GIFT PRODUCTS
router.post('/create-product', authProtected, giftProductController.createGiftProduct);
// router.post('/product-img/:id', uploadMultipleProductPhoto, resizeProductPhotos, giftProductController.uploadProductImg);
router.post('/product-img/:id', uploadMultipleProductPhoto, giftProductController.uploadProductImg);

router.get('/products', giftProductController.getAllGiftProducts);

router.get('/products/:productID', giftProductController.getGiftProductById);
router.get('/products/category/:category', authProtected, giftProductController.getGiftProductsByCategories);
router.get('/all/products/category/:category', giftProductController.getGiftProductsByCategoriesAll);



// CURRENT VENDOR GIFT PRODUCTS
router.get('/my-products', authProtected, giftProductController.allMyProducts);
router.patch('/update-my-product/:productID', authProtected, giftProductController.updateGiftProduct);
router.delete('/delete-my-product/:productID', authProtected, giftProductController.deleteGiftProduct);



module.exports = router;