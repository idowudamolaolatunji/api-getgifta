const express = require('express');

const searchController = require('../controllers/searchControllers');
const { authProtected } = require('../middlewares/auth');

const router  = express.Router();

router.get('/', authProtected, searchController.searchOnGifta);
router.get('/find-username', authProtected, searchController.searchUsersByUsername);

module.exports = router;