const express = require('express');

const { authProtected } = require('../middlewares/auth');
const ideaBoxController = require('../controllers/ideaBoxController');
const { uploadSinglePhoto, resizeSinglePhoto } = require('../middlewares/multer');

const router = express.Router();

// idea CATEGORIES
router.post('/create-category', ideaBoxController.createIdeaBoxCategory);
router.get('/all-category', ideaBoxController.getAllIdeaBoxCategories);

// ideaBox
router.post('/create-idea', ideaBoxController.createIdeaBox);
router.post('/idea-img/:id', uploadSinglePhoto, resizeSinglePhoto, ideaBoxController.uploadImg);

router.get('/ideas', ideaBoxController.getAllIdeaBox);
router.get('/ideas/category/:category', ideaBoxController.getIdeaBoxByCategories);


module.exports = router;