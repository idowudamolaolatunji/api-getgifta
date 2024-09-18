const User = require('../models/userModel');
const Gifting = require('../models/giftingModel');
const Order = require('../models/orderModel');
const Wallet = require('../models/walletModel');
const GiftProduct = require('../models/giftProductModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/NotificationModel');

////////////////////////////////////////////////////////
const verifyPayment = require('../utils/verifyPayment');
const formatDate = require('../utils/formatDate');


exports.paymentWithCard = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        
        // GET THE RESPONSE DATA
        const paymentVerification = await verifyPayment(reference);
        const response = paymentVerification.data.data;
        const amount = (Number(response.amount) / 100) - charges;
        console.log(paymentVerification);

        // HANDLE PAYMENT VERIFICATION STATUS
        if (paymentVerification.status !== 200) {
            return res.status(400).json({
                status: 'fail',
                message: 'Unable to verify payment',
            });
        }
        
        const user = await User.findById(req.user._id);
        if(!user) return res.json({ message: 'User not found! '});

        // FIND THE PRODUCT, AND FIND THE VENDOR BASED ON THE PRODUCT ID
        const giftProduct = await GiftProduct.findById(req.body.productId);
        console.log(giftProduct);
        const vendor = await User.findById(giftProduct.vendor);
        if(!giftProduct || !vendor) return res.json({ message: 'Product or Vendor cannot be found' });

        // CREATE TRANSACTIONS
        const userTransaction = await Transaction.create({
            user: user?._id,
            amount,
            reference,
            status: 'success',
            purpose: 'gifting',
            charged:  true,
            paidAt: response.paidAt,
        });
        
        const vendorTransaction = await Transaction.create({
            user: vendor?._id,
            amount,
            reference: reference + '_vn',
            status: 'success',
            purpose: 'order',
            charged:  true,
            paidAt: response.paidAt
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Payment successful',
            data: {
                user, vendor, userTransaction, vendorTransaction
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


exports.paymentWithWalletBal = async (req, res) => {
    try {
        const { amount, productId } = req.body;
        const user = await User.findById(req.user._id);
        const giftProduct = await GiftProduct.findById(productId);
        const vendor = await User.findById(giftProduct?.vendor);
        if(!giftProduct || !vendor) return res.json({ message: 'Product or Vendor cannot be found' });

        // FIND WALLET AND DO SOME CHECKINGS
        const userWallet = await Wallet.findOne({ user: user?._id });
        if(userWallet.walletBalance < Number(amount)) return res.json({ message: 'Insufficient funds in the wallet' });
        
        // DEDUCT MONEY FROM BUYER
        userWallet.walletBalance -= Number(amount);
        await userWallet.save({});
        
        const userTransaction = await Transaction.create({
            user: user._id,
            amount: Number(amount),
            reference: Date.now(),
            status: 'success',
            purpose: 'gifting',
            charged:  true,
        });
        
        const vendorTransaction = await Transaction.create({
            user: vendor._id,
            amount: Number(amount),
            reference: Date.now(),
            status: 'pending',
            purpose: 'order',
            charged:  true,
        });

        res.status(200).json({
            status: 'success',
            message: 'Payment successful',
            data: {
                user, vendor, userTransaction, vendorTransaction
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


// CREATE GIFTING PACKAGE
exports.createGiftings = async (req, res) => {
    try {
        const gift = await GiftProduct.findById(req.body.productId);
        console.log(gift, 'Line 133');
        const vendor = await User.findById(gift.vendor);
        const user = await User.findById(req.user?._id);
        if(!gift || !vendor) return res.json({ message: 'Gift product or vendor not found!' });

        const gifting = await Gifting.create({
            gifter: user._id,
            gift: gift._id,
            vendor: vendor._id,
            purpose: req.body.purpose,
            celebrant: req.body.celebrant,
            description: req.body.description,
            amount: req.body.amount,
            country: req.body.country,
            state: req.body.state,
            contact: req.body.contact,
            address: req.body.address,
            deliveryDate: new Date(req.body.date),
            isPaidFor: true,
        });

        await Notification.create({
			user: user._id,
			title: 'New Gifting Purchase',
			content: `You just made an order for a gift for ${formatDate(req.body.date)}`
		});

        const giftOrder = await Order.create({
            gifter: user._id,
            gift: gift._id,
            vendor: vendor._id,
            giftingPackageID: gifting._id,
            celebrant: req.body.celebrant,
            amount: req.body.amount,
            purpose: req.body.purpose,
            quantity: req.body.quantity,
            country: req.body.country,
            state: req.body.state,
            contact: req.body.contact,
            address: req.body.address,
            deliveryDate: new Date(req.body.date),
            isPaidFor: true,
            isDelivered: false,
        });

        await Notification.create({
			user: vendor?._id,
			title: 'New Product Order',
			content: `You just got an order for a gift for ${formatDate(req.body.date)}`
		});

        res.status(201).json({
            status: 'success',
            message: 'Gifting package created, Order complete!',
            data: {
                gifting, order: giftOrder
            }
        });

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// ADD GIFTING IMAGES
exports.uploadGiftingImg = async (req, res) => {
    try {
        let image;
        if(req.file) image = req.file.filename;
        console.log(image, req.params.id)

        const updatedGifting = await Gifting.findByIdAndUpdate(req.params.id, {celebrantImage: image}, {
            new: true,
            runValidators: true,
        });
        const updatedOrder = await Order.findOneAndUpdate({ giftingPackageID: req.params.id }, {celebrantImage: image}, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            data: {
                gifting: updatedGifting,
                order: updatedOrder
            }
        });
    } catch(err) {
        console.log(err)
    }
}


// GET ALL GIFTING PACKAGES
exports.getEveryGiftings = async (req, res) => {
    try {
        const giftings = await Gifting.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: giftings.length,
            data: {
                giftings
            }
        });

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}

exports.getGiftingsById = async (req, res) => {
    try {
        const gifting = await Gifting.findById(req.params.giftingId).sort({ createdAt: -1 });
        if(!gifting) return res.json({
            message: 'Gifting not found'
        })

        res.status(200).json({
            status: 'success',
            data: {
                gifting
            }
        });

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// GET ALL MY GIFTING PACKAGES
exports.getMyGiftings = async (req, res) => {
    try {
        const currUserId = req.user._id;
        console.log(currUserId)
        const giftings = await Gifting.find({ gifter: currUserId }).sort({ createdAt: -1 });
        console.log(true)

        res.status(200).json({
            status: 'success',
            count: giftings.length,
            data: {
                giftings
            }
        });
    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// UPDATING GIFTING PACKAGE BY ID
exports.updateGiftingById = async (req, res) => {
    try {

        // FIND THE GIFTER AS THE REQUESTING USER
        const gifter = await User.findById(req.user._id);
        if(!gifter || !gifter.isActive) return res.json({ 
            message: 'Cannot find gifter!',
        });

        // CHECK IF IT IS FOUND
        if(!(await Gifting.findById(req.params.giftingId))) return res.json({
            message: 'Cannot find Package'
        });

        // FIND GIFTING PACKAGE BY BOTH GIFTER AND PACKAGE ID
        const gifting = await Gifting.findOneAndUpdate(
            { id: req.params.giftingId,  gifter: gifter._id }, req.body, { runValidators: true, new: true }
        );

        await Notification.create({
			user: gifter?._id,
			title: 'Updated Gifting!',
			content: `You just updated a gifting!`
		});

        res.status(200).json({
            status: 'success',
            message: 'Package updated!',
            data: {
                gifting,
            }
        });

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}



// DELETING GIFTING PACKAGE
exports.deleteGiftingById = async (req, res) => {
    try {

        // FIND THE GIFTER AS THE REQUESTING USER
        const gifter = await User.findById(req.user._id);
        if(!gifter || !gifter.isActive) return res.json({ 
            message: 'Cannot find gifter!',
        });

        await Gifting.findOneAndDelete(
            { id: req.params.giftingId,  gifter: gifter._id }
        );

        await Notification.create({
			user: gifter?._id,
			title: 'Deleted Gifting!',
			content: `You just deleted a gifting!`
		});

        res.status(200).json({
            status: 'success',
            message: 'Package deleted!',
            data: null
        })

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.myGiftingOrders = async (req, res) => {
    try {
        const orders = async

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}

}
