const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const Transaction = require('../models/transactionModel');
const Notification = require('../models/NotificationModel');
const { countSixMonthsFromNow, countOneYearFromNow } = require('../utils/countFromNowDate');

const verifyPayment = require('../utils/verifyPayment');
const moment = require('moment');
const GiftaEarnings = require('../models/earningsModel');



// MAKE SUBSCRIPTION FROM CARD
exports.subScribeFromCard = async (req, res) => {
    try {
        const { reference, charges } = req.params;
        const { plan } = req.body;

        // FIND THE CURRENT USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}

        const prevSubscription = await Subscription.findOne({ user: req.user._id });

        // VERIFY PAYSTACK PAYMENT WITH THE REFERNECE PARAMS
		const paymentVerification = await verifyPayment(reference);
		// GET THE RESPONSE DATA
		const response = paymentVerification?.data.data;

		// HANDLE PAYMENT VERIFICATION STATUS
		if (paymentVerification.status !== 200) {
			return res.status(400).json({
				status: "fail",
				message: "Unable to verify payment",
			});
		}

        const paidAmount = Number(Number(response.amount) / 100 - charges);
        
        if(prevSubscription) {
            prevSubscription.duration = plan;
            prevSubscription.save({});
        }

        await Subscription.create({
            user: currentUser._id,
            duration: plan,
            expirationDate: plan === 'semi-annual' ? countSixMonthsFromNow() : countOneYearFromNow()
        });

        currentUser.isPremium = true;
        currentUser.premiumDuration = plan === 'semi-annual' ? 'half' : 'full';
        await currentUser.save({ validateBeforeSave: false });

        const GiftaWallet = await GiftaEarnings.findById(process.env.GIFTA_EARNINGS_DOC_ID);
        GiftaWallet.balance += paidAmount;
        await GiftaWallet.save();

        // CREATE TRANSACTION DOCUMENT
        await Transaction.create({
			user: currentUser._id,
			amount: paidAmount,
			reference: response.reference,
			status: "success",
			purpose: "subscription",
			charged: true,
		});

        // CREATE NOTIFICATION DOCUMENT
        await Notification.create({
			user: currentUser.id,
			title: 'Successful Subscription!',
			content: `You have unlimited access for the next ${plan === 'annual' ? '"One Year"' : '"Six Months"'}`,
		});

        res.status(200).json({
            status: 'success',
            message: `${plan === 'annual' ? '"One Year"' : "Six Months"} subscription Successful`,
            data: {
                user: currentUser
            }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


// MAKE SUBSCRIPTION FROM WALLET
exports.subscribeFromWallet = async (req, res) => {
    try {
        const { plan, amount } = req.body;

        // FIND THE CURRENT USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}

        const prevSubscription = await Subscription.findOne({ user: currentUser._id });
        const userWallet = await Wallet.findOne({ user: currentUser._id });
        if(amount > userWallet.walletBalance) {
            return res.json({ message: 'Insufficient wallet balance' });
        }

        userWallet.walletBalance -= amount;
        await userWallet.save({});

        if(prevSubscription) {
            prevSubscription.duration = plan;
            prevSubscription.save({});
        }

        if(!prevSubscription) {
            await Subscription.create({
                user: currentUser._id,
                duration: plan,
                expirationDate: plan === 'semi-annual' ? countSixMonthsFromNow() : countOneYearFromNow()
            });
        }

        currentUser.isPremium = true;
        currentUser.premiumDuration = plan === 'semi-annual' ? 'half' : 'full';
        await currentUser.save({ validateBeforeSave: false });

        const GiftaWallet = await GiftaEarnings.findById(process.env.GIFTA_EARNINGS_DOC_ID);
        GiftaWallet.balance += amount;
        await GiftaWallet.save();

        // CREATE TRANSACTION DOCUMENT
        await Transaction.create({
			user: currentUser._id,
			amount,
			reference: Date.now(),
			status: "success",
			purpose: "subscription",
			charged: true,
		});

        // CREATE NOTIFICATION DOCUMENT
        await Notification.create({
			user: currentUser.id,
			title: 'Successful Subscription!',
			content: `You have unlimited access for the next ${plan === 'annual' ? '"One Year"' : '"Six Months"'}`,
		});

        res.status(200).json({
            status: 'success',
            message: `${plan === 'annual' ? '"One Year"' : "Six Months"} subscription Successful`,
            data: {
                user: currentUser
            }
        })
    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


// exports.checkForExpiredSubscriptions = async (req, res) => {
//     try {
//         const premiumUsers = await User.find({ isPremium: true });
//         const allOngoingSub = await Subscription.find({ user: { $in: premiumUsers.map((user) => user._id) }, duration: { $ne: 'not-sub' } });

//         console.log(allOngoingSub);

//         const currentDate = moment();
//         const expiresToday = allOngoingSub.map(sub => sub.expirationDate)

// 	// await Reminder.updateMany({ _id: { $in: reminders.map((reminder) => reminder._id) } }, { status: "sent" });

//     } catch(err) {
//         return res.status(400).json({
//             status: 'fail',
//             message: err.message,
//         });
//     }
// }


