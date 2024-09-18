const express = require('express');

const orderController = require('../controllers/orderController');
const { authProtected } = require('../middlewares/auth');


const router = express.Router();

router.get('/all-order', orderController.getAllOrders);
router.get('/all-completed-order', orderController.getAllVendorCompletedOrders);

router.get('/', authProtected, orderController.getMyOrders);
router.get('/pending', authProtected, orderController.orderPending);
router.get('/completed', authProtected, orderController.orderCompleted);

router.patch('/accept-order/:orderId/:giftingId', authProtected, orderController.acceptOrder);
router.patch('/reject-order/:orderId/:giftingId', authProtected, orderController.rejectedOrder);
router.patch('/complete-order/:orderId/:giftingId', authProtected, orderController.completeOrder);

module.exports = router;