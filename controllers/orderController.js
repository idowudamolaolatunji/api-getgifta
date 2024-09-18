const Notification = require('../models/NotificationModel');
const Gifting = require('../models/giftingModel');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const GiftaEarnings = require('../models/earningsModel');
const Transaction = require('../models/transactionModel');


// GET ALL VENDOR ORDERS
exports.getAllOrders = async(req, res) => {
    try {
        const orders = await Order.find();

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


// GET ALL VENDOR COMPLETE ORDERS
exports.getAllVendorCompletedOrders = async(req, res) => {
    try {
        const orders = await Order.find({ isDelivered: true });

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


// GET MY ORDERS
exports.getMyOrders = async(req, res) => {
    try {
        const vendor = await User.findById(req.user._id);
        if(!vendor || vendor.role !== 'vendor') return res.json({ message: 'You are not a vendor!' });

        const orders = await Order.find({ vendor: vendor._id }).sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        });

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


// GET MY PENDING ORDERS
exports.orderPending = async(req, res) => {
    try {
        const vendor = await User.findById(req.user._id);
        if(!vendor || vendor.role !== 'vendor') return res.json({ message: 'You are not a vendor!' });

        const orders = await Order.find({ vendor: vendor._id, isDelivered: false });

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


// GET MY COMPLETE ORDERS
exports.orderCompleted = async(req, res) => {
    try {
        const vendor = await User.findById(req.user._id);
        if(!vendor || vendor.role === 'vendor') return res.json({ message: 'You are not a vendor!' });

        const orders = await Order.find({ vendor: vendor._id, isDelivered: true });

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


////////////////////////////////////////////////////

exports.acceptOrder = async (req, res) => {
    try {
        const { orderId, giftingId } = req.params;
        const vendor = await User.findById(req.user._id);
        if(!vendor || !vendor.isActive) {
            return res.json({ message: 'Cannot find vendor! '});
        }
        // console.log('OrderId:', orderId);
        // console.log('============= 1 ================')
        // console.log('Vendor Object:', vendor);

        const order = await Order.findOne({ _id: orderId, vendor: vendor._id });
        console.log(order)
        if(!order) return res.json({
            message: 'Order not found!'
        });
        if(order.isAcceptedOrder || order.isDelivered) return res.json({
            message: 'Already accepted or completed order!'
        });
        if(order.isRejectedOrder) return res.json({
            message: 'Order already rejected!'
        });

        // FIND THE VENDOR AND ADD THE MONEY TO HIS PENDING WALLET BALANCE
        const vendorWallet = await Wallet.findOne({ user: vendor._id });
        vendorWallet.pendingWalletBalance += order.amount;
        await vendorWallet.save({});

        // FIND THE GIFTER
        const gifter = await User.findById(order.gifter._id);
        if(!gifter || !gifter.isActive) return res.json({
            message: 'Gifter cannot be found'
        });

        // ALSO LOOK FOR HIS GIFTING AND ADD DELIVERY ON APPROVAL
        const gifterGifting = await Gifting.findOne({ _id: giftingId, gifter: gifter._id, gift: order.gift._id });
        const deliveryCode = Math.floor(1000 + Math.random() * 9000);
        gifterGifting.deliveryCode = deliveryCode;
        await gifterGifting.save({});

        // console.log('============== 2 ===============')
        // console.log('User Gifting:', gifterGifting)

        // THEN ACCEPT ORDER
        order.isAcceptedOrder = true;
        order.status = 'approved';
        gifterGifting.isAccepted = true;
        await order.save({});
        await gifterGifting.save({});


        // SEND THE CORRESPONDING NOTIFICATION
        await Notification.create({
			user: vendor._id,
			title: 'Accepted Order!',
			content: `You just accepted the ${order?.gift?.category} order for ${order?.celebrant}!`
		});
        await Notification.create({
			user: gifter._id,
			title: 'Accepted Order!',
			content: `Your Order was just accepted by the seller!`
		});
        await Notification.create({
			user: vendor._id,
			title: 'Order Payment Transfered!',
			content: `Payment for this order was transfered to your pending balance till order is completed!`
		});

        const orders = await Order.find({ vendor: vendor._id }).sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            message: 'Order Accepted Successfully!',
            data: {
                order,
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


exports.rejectedOrder = async (req, res) => {
    try {
        const { orderId, giftingId } = req.params;
        const vendor = await User.findById(req.user._id);
        if(!vendor || !vendor.isActive) {
            return res.json({ message: 'Cannot find vendor! '});
        }
        
        const order = await Order.findOne({ _id: orderId, vendor: vendor._id });
        if(!order) {
            return res.json({ message: 'Order not found!'});
        }
        if(order.isAcceptedOrder || order.isDelivered) return res.json({
            message: 'Already accepted or completed order!'
        })
        if(order.isRejectedOrder) return res.json({
            message: 'Order already rejected!'
        })

        const gifter = await User.findById(order.gifter._id);
        if(!gifter || !gifter.isActive) {
            return res.json({
                message: 'Cannot find the gifter'
            });
        }

        // REFUND THE BUYER BACK HIS MONEY
        const gifterWallet = await Wallet.findOne({ user: gifter._id });
        gifterWallet.walletBalance += order.amount;
        await gifterWallet.save({});

        const gifterGifting = await Gifting.findOne({ _id: giftingId, gifter: gifter._id, gift: order.gift._id });
        if(!gifterGifting) {
            return res.json({ message: 'Gifting not found!'});
        }
        
        // REJECT THE ORDER
        order.isRejectedOrder = true;
        order.status = 'rejected';
        gifterGifting.isRejected = true;
        await order.save({});
        await gifterGifting.save({});

        // SEND THE CORRESPONDING ORDERS
        await Notification.create({
			user: vendor._id,
			title: 'Rejected Order!',
			content: `You just rejected the ${order?.gift?.category} order for ${order?.celebrant}!`
		});
        await Notification.create({
			user: gifter._id,
			title: 'Rejected Order',
			content: `Your Order was just Rejected by the seller, And you've been refunded!`
		});

        // CREATE TRANSACTIONS
        await Transaction.create({
            user: vendor?._id,
            amount,
            reference: Date.now() + '_vn',
            status: 'failed',
            purpose: 'order',
            charged:  true,
            paidAt: Date.now()
        });

        const orders = await Order.find({ vendor: vendor._id }).sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            message: 'Order Rejected Successfully!',
            data: {
                order,
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


exports.completeOrder = async (req, res) => {
    try {
        const { orderId, giftingId } = req.params;
        // FIND VENDOR
        const vendor = await User.findById(req.user._id);
        if(!vendor || !vendor.isActive) {
            return res.json({ message: 'Cannot find vendor! '});
        }
        
        // FIND ORDER
        const order = await Order.findOne({ _id: orderId, vendor: vendor._id });
        if(!order) {
            return res.json({ message: 'Order not found!'});
        }
        if(order.isDelivered) return res.json({
            message: 'Already completed order!'
        });
        if(order.isRejectedOrder) return res.json({
            message: 'Order was already rejected!'
        })

        // FIND GIFTER
        const gifter = await User.findById(order.gifter._id);
        if(!gifter || !gifter.isActive) {
            return res.json({
                message: 'Cannot find the gifter'
            });
        }

        const gifterGifting = await Gifting.findOne({ _id: giftingId, gifter: gifter._id, gift: order.gift._id });
        if(!gifterGifting) {
            return res.json({ message: 'Gifting not found!'});
        }
        const gifterGiftDeliveryCode = gifterGifting.deliveryCode;
        const vendorOrderDeliveryCode = Number(req.body.deliveryCode);
        // console.log(gifterGiftDeliveryCode, vendorOrderDeliveryCode)

        if(gifterGiftDeliveryCode !== vendorOrderDeliveryCode) {
            return res.json({
                message: 'Confirmation code invalid',
            })
        }

        order.isDelivered = true;
        order.status = 'delivered'
        gifterGifting.isDelivered = true;
        await order.save({});
        await gifterGifting.save({});

        // FIND THE VENDOR AND ADD THE MONEY TO HIS WALLET BALANCE
        const vendorWallet = await Wallet.findOne({ user: vendor._id });
        const GiftaWallet = await GiftaEarnings.findById(process.env.GIFTA_EARNINGS_DOC_ID);

        const vendorProfit = 0.95 * Number(order.amount);
        const giftaProfit = 0.05 * Number(order.amount);
        
        vendorWallet.pendingWalletBalance -= order.amount;
        vendorWallet.walletBalance += vendorProfit;
        GiftaWallet.balance += giftaProfit;
        await vendorWallet.save({});
        await GiftaWallet.save({});

        await Transaction.create({
            user: vendor?._id,
            amount: vendorProfit,
            reference: Date.now() + '_vn',
            status: 'success',
            purpose: 'order',
            charged:  true,
            paidAt: Date.now()
        });

        // SEND THE CORRESPONDING ORDERS
        await Notification.create({
			user: vendor._id,
			title: 'Completed Your Order 👏🏿!',
			content: `You just successfully delivered and completed the ${order?.gift?.category} order for ${order?.celebrant}!, Check wallet to see recieved funds!`
		});
        await Notification.create({
			user: gifter._id,
			title: 'Completed Order',
			content: `Your Order for ${order?.gift?.category} gift was just delivered and completed!`
		});

        const orders = await Order.find({ vendor: vendor._id }).sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            message: 'Order Completed Successfully',
            data: {
                order,
                orders
            }
        })
        

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}