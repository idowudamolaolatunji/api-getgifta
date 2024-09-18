const DigitalSticker = require('../models/digitalStickerModel');
////////////////////////////////////////////////////////

const BoughtSticker = require('../models/boughtStickerModel');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const Notification = require('../models/NotificationModel');
const capitalizeFirstLetter = require('../utils/capitalizeFirstLetter');
const GiftedSticker = require('../models/giftedStickerModel');
const numberConverter = require('../utils/numberConverter');
const Transaction = require('../models/transactionModel');


exports.createSticker = async (req, res) => {
    try {
        console.log('I am here')

        const isAlreadyCreated = await DigitalSticker.findOne({ type: req.body.stickerType });

        if(isAlreadyCreated) {
            return res.json({
                message: `${capitalizeFirstLetter(isAlreadyCreated.type)} is already Created!!`
            });
        }

        const sticker = await DigitalSticker.create({
            type: req.body.stickerType,
            price: req.body.price,
        });

        res.status(201).json({
            status: 'success',
            message: 'Sticker Created Successfully!',
            data: {
                sticker
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}


// ADD IMAGES
exports.uploadImg = async (req, res) => {
    try {
        let image;
        if(req.file) image = req.file.filename;

        await DigitalSticker.findByIdAndUpdate(req.params.id, 
            { image }, 
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            status: 'success',
			message: 'Image upload successful'
        });
    } catch(err) {
		return res.status(400).json({
            status: 'fail',
			message: err.message
        });
    }
}


exports.getStickers = async (req, res) => {
    try {
        const stickers = await DigitalSticker.find({});

        res.status(200).json({
            status: 'success',
            count: stickers.length,
            data: {
                stickers
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}


exports.getStickerById = async (req, res) => {
    try {
        const sticker = await DigitalSticker.findById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: {
                sticker,
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}


exports.updateStickerById = async (req, res) => {
    try {
        const sticker = await DigitalSticker.findByIdAndUpdate(req.params.id, req.body, {
            runValidators: true, new: true
        });

        res.status(200).json({
            status: 'success',
            message: 'Sticker Updated Successfully',
            data: {
                sticker
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}



exports.deleteStickerById = async (req, res) => {
    try {
        await DigitalSticker.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            status: 'success',
            message: 'Sticker Deleted Successfully',
            data: null
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

exports.purchaseSticker = async (req, res) => {
    try {
        const { stickerType, quantity } = req.body;

        const currUser = await User.findById(req.user._id);
        if(!currUser || !currUser.isActive) {
            return res.json({
                message: 'Cannot find user',
            });
        }

        const currUserWallet = await Wallet.findOne({ user: currUser?._id });
        const sticker = await DigitalSticker.findOne({ type: stickerType });

        const stickerAmount = (sticker.price * quantity);

        if(currUserWallet.walletBalance < stickerAmount) {
            await Notification.create({
                user: currUser._id,
                title: 'Insufficient 🤯 Wallet Balance',
                content: "Deposit to your wallet to purchase a sticker 😊",
            })
            return res.json({
                message: 'Insufficient wallet Balance'
            });
        }

        currUserWallet.walletBalance -= stickerAmount;
        await currUserWallet.save();

        let purchasingSticker;
        const alreadyBoughtSticker = await BoughtSticker.findOne({ stickerType: stickerType, user: currUser?._id });

        if(alreadyBoughtSticker) {
            alreadyBoughtSticker.balance += quantity;
            await alreadyBoughtSticker.save();
        } else {
            purchasingSticker = await BoughtSticker.create({
                user: currUser._id,
                sticker: sticker._id,
                stickerType,
                balance: quantity,
            });
        }

        await Notification.create({
            user: currUser._id,
            title: `Purchased ${stickerType} sticker!`,
            content: `You just purchased ${numberConverter(quantity)} ${stickerType} stickers for ₦${numberConverter(stickerAmount)}`
        });

        res.status(200).json({
            status: 'success',
            message: `${capitalizeFirstLetter(stickerType)} Purchase Successfully!`,
            data: {
                sticker: alreadyBoughtSticker ? alreadyBoughtSticker : purchasingSticker
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}


exports.getMyBoughtStickers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if(!user || !user.isActive) {
            return res.json({
                message: 'user not found!'
            });
        }

        const boughtStickers = await BoughtSticker.find({ user: user._id });
        res.status(200).json({
            status: 'success',
            count: boughtStickers.length,
            data: {
                stickers: boughtStickers,
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}


//////////////////////////////////////////////////////////////////////////////
// Gift sticker
exports.giftSticker = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { username, quantity, stickerType } = req.body;
        const stickerAmount = Number(quantity);

        const gifter = await User.findById(req.user._id);
        if(!gifter || !gifter.isActive) {
            return res.json({ message: 'Cannot find request user' });
        }

        const user = await User.findOne({ username }).select('-password');
        if(!user || !user.isActive) {
            return res.json({ message: 'Cannot find user' });
        }

        const stickerDoc = await DigitalSticker.findOne({ type: stickerType });
        const gifterSticker = await BoughtSticker.findOne({ _id: itemId, user: gifter._id });

        if(gifterSticker.balance < stickerAmount) {
            return res.json({ message: `Insufficient ${stickerType} sticker balance` });
        }

        let giftingSticker;
        const alreadyGiftedSticker = await GiftedSticker.findOne({ stickerType, gifter: gifter._id, user: user._id });
        // const alreadyGiftedSticker = await GiftedSticker.findOne({ stickerType, user: user._id });
        console.log(stickerAmount, alreadyGiftedSticker)

        // deduct from sender
        gifterSticker.balance -= stickerAmount
        await gifterSticker.save()

        if(alreadyGiftedSticker) {
            alreadyGiftedSticker.balance += stickerAmount;
            await alreadyGiftedSticker.save()
        } else {
            giftingSticker = await GiftedSticker.create({
                gifter: gifter._id,
                user: user._id,
                sticker: stickerDoc._id,
                stickerType,
                balance: stickerAmount
            });
        }
        
        await Notification.create({
            user: gifter._id,
            title: `Gifted ${stickerType} sticker 👏🏿`,
            content: `You just gifted @${username} ${numberConverter(stickerAmount)} ${stickerType} stickers!`
        });

        await Notification.create({
            user: user._id,
            title: `Gift ${stickerType} sticker 💖`,
            content: `Someone just gifted you ${numberConverter(stickerAmount)} ${stickerType} stickers!!`
        });

        // console.log(alreadyGiftedSticker, giftingSticker)

        res.status(200).json({
            status: 'success',
            message: `${capitalizeFirstLetter(stickerType)} Gifting Successfully!`,
            data: {
                sticker: alreadyGiftedSticker ? alreadyGiftedSticker : giftingSticker
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}

// Get all my gifted stickers
exports.getMyGiftedStickers = async (req, res) => {
    try {

        const currUser = await User.findById(req.user._id);
        if(!currUser || !currUser.isActive) {
            return res.json({ message: 'Cannot find user' });
        }

        const gifteds = await GiftedSticker.find({ user: currUser._id}).sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            count: gifteds.length,
            data: {
                gifts: gifteds
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}

// Redeem sticker
exports.redeemGiftedSticker = async (req, res) => {
    try {

        const { itemId } = req.params;
        const { quantity, stickerType } = req.body;
        const quantityAmount = Number(quantity);

        const currUser = await User.findById(req.user._id);
        if(!currUser || !currUser.isActive) {
            return res.json({ message: 'Cannot find user' });
        }

        const giftedItem = await GiftedSticker.findOne({ user: currUser._id, _id: itemId });
        const sticker = await DigitalSticker.findOne({ type: stickerType });

        if(quantityAmount > giftedItem.balance) {
            return res.json({
                message: 'Insufficient Item balance',
            });
        }
        const calcPrice = quantityAmount * sticker.price;
        // console.log(quantityAmount, '*', sticker.price, '=', calcPrice, giftedItem.balance);

        giftedItem.balance -= quantityAmount;
        await giftedItem.save();

        const userWallet = await Wallet.findOne({ user: currUser._id });
        userWallet.walletBalance += calcPrice;
        await userWallet.save();

        await Notification.create({
            user: currUser._id,
            title: `Redeemed ${stickerType} sticker! 🎉🤑`,
            content: `You just redeemed ${numberConverter(quantityAmount)} ${stickerType} stickers and made ₦${numberConverter(calcPrice)}!`
        });

        await Transaction.create({
            user: currUser._id,
			amount: calcPrice,
			reference: Date.now(),
			status: "success",
			purpose: 'redeemed',
			charged: true,
        });

        res.status(200).json({
            status: 'success',
            message: `Redeemed ${numberConverter(quantityAmount)} stickers successfully!`,
            data: {
                item: giftedItem
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'success',
            message: err.message,
        });
    }
}
//////////////////////////////////////////////////////////////////////////////