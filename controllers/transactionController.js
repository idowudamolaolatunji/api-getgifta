const Transaction = require("../models/transactionModel");
const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const Notification = require("../models/NotificationModel");
const GiftaEarnings = require("../models/earningsModel");

///////////////////////////////////////////////////////
const verifyPayment = require("../utils/verifyPayment");
const numberConverter = require("../utils/numberConverter");
const Admin = require("../models/adminModel");

// GET GIFTA PROFIT BALANCE
exports.giftaProfit = async (req, res) => {
	try {
		const profit = await GiftaEarnings.findById(process.env.GIFTA_EARNINGS_DOC_ID);

		res.status(200).json({
			status: "success",
			data: {
				profit
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET USER WALLET AND BALANCE
exports.getWallet = async (req, res) => {
	try {
		const wallet = await Wallet.findOne({ user: req.user._id });
		console.log(wallet);

		res.status(200).json({
			status: "success",
			data: {
				wallet,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

//  CREATE WALLET DEPOSITS
exports.walletDeposit = async (req, res) => {
	try {
		const { reference, charges } = req.params;

		// FIND THE CURRENT USER
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}

		// VERIFY PAYSTACK PAYMENT WITH THE REFERNECE PARAMS
		const paymentVerification = await verifyPayment(reference);
		// GET THE RESPONSE DATA
		const response = paymentVerification.data.data;
		console.log(response);

		// HANDLE PAYMENT VERIFICATION STATUS
		if (paymentVerification.status !== 200) {
			return res.status(400).json({
				status: "fail",
				message: "Unable to verify payment",
			});
		}

		// UPDATE THE USER WALLET BALANCE
		const amount = Number(response.amount) / 100 - charges;
		const userWallet = await Wallet.findOne({ user: currentUser._id });
		userWallet.walletBalance += amount;
		await userWallet.save({});

		// CREATE TRANSACTION DOCUMENT
		const newDeposit = await Transaction.create({
			user: currentUser.id,
			amount,
			reference: response.reference,
			status: "success",
			purpose: "deposit",
			charged: true,
		});

		const newNotification = await Notification.create({
			user: currentUser.id,
			title: 'New Deposit',
			content: `A deposit of ₦${numberConverter(amount)} was made!`
		});

		res.status(200).json({
			status: "success",
			message: "Deposited Successfully",
			data: {
				newDeposit,
				newNotification
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.walletFundsWithdrawal = async (req, res) => {
	try {
		const amount = Number(req.body.amount);
		const currentUser = await User.findById(req.user._id).select('+password');
        if(!currentUser || !currentUser.isActive) return res.json({ message: 'User not found!' });

        // 0. CHECK IF THE PROVIDED PASSWORD IS CORRECT
        if (!(await currentUser?.comparePassword(req.body.password, currentUser.password))) {
            return res.json({ message: "Incorrect password " });
        }

        // 1. IF WALLET BALANCE IS LESS THAN THE REQUESTING AMOUNT
		const userWallet = await Wallet.findOne({ user: currentUser._id });
        if(userWallet.walletBalance < amount) {
            return res.json({ message: 'Insufficient balance to complete request!' });
        }
        
        // 2. IF THE REQUESTING AMOUNT IS LESS THAN THE SET MINIMUM WITHDRAWAL AMOUNT
        const minimumAmount = 1000;
        if(amount < minimumAmount) {
            return res.json({ message: 'Minimum Withdrawal is ₦1,000' });
        };

        // 3. DEBIT AND UPDATE THE WALLET BALANCE 
		userWallet.walletBalance -= amount;
		await userWallet.save({});

		const withdrawalRequest = await Transaction.create({
			user: currentUser.id,
			amount,
			reference: Date.now(),
			status: "pending",
			purpose: "withdrawal",
			charged: true,
		});

		const newNotification = await Notification.create({
			user: currentUser.id,
			title: 'New Withdrawal',
			content: `A withdrawal of ₦${numberConverter(amount)} was made!`
		});

		res.status(200).json({
			status: 'success',
			message: 'Request successful, might take up to 24hrs',
			data: {
				withdrawalRequest,
				newNotification
			}
		});

	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}


exports.approvalWithdrawalRequest = async (req, res) => {
	try {
		// CONFIRM THAT ADMIN ACCESS TO PERFORM TASK
        const { password } = req.body;
        const admin = await Admin.findById(req.user._id).select('+password');
        if(!(await admin.comparePassword(password, admin.password))) {
			return res.json({ message: "Incorrect password" });
		}		

		// CHECKING IF THE REQUEST IS STILL PENDING FOR APPROVAL
        const withdrawalRequest = await Transaction.findById(req.params.id);
        if(!withdrawalRequest) {
            return res.json({
                message: 'Withdrawal has either been processed, or cannot be found!'
            });
        }
        const currentUser = await User.findById(withdrawalRequest.user._id);
		const userWallet = await Wallet.findOne({ user: currentUser._id });

		if(!withdrawalRequest.charged) {
			if(userWallet.walletBalance >= withdrawalRequest.amount) {
                userWallet.walletBalance -= withdrawalRequest.amount;
                withdrawalRequest.status = 'success';
                await withdrawalRequest.save({});
				await userWallet.save({});

				const newNotification = await Notification.create({
					user: currentUser.id,
					title: 'New Approved Withdrawal',
					content: `A withdrawal of ₦${numberConverter(withdrawalRequest.amount)} was sent to your bank!`
				});

                return res.status(200).json({
                    status: 'success',
                    message: 'Withdrawal successful',
					data: {
						withdrawalRequest,
						newNotification,
					}
                });
            } else {
                withdrawalRequest.status = 'failed';
                await withdrawalRequest.save({});
                return res.json({
                    message: 'Withdrawal cannot be complete!, User no longer have suffiecient balance!',
                });
            }
		}

		// ELSE UPDATE THE WITHDRAWAL REQUEST
        withdrawalRequest.status = 'success';
        await withdrawalRequest.save({});
		const newNotification = await Notification.create({
			user: currentUser.id,
			title: 'New Approved Withdrawal',
			content: `A withdrawal of ₦${numberConverter(withdrawalRequest.amount)} was sent to your bank!`
		});

        res.status(200).json({
            status: 'success',
            message: 'Withdrawal successful',
			data: {
				withdrawalRequest,
				newNotification
			}
        });

	} catch(err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}


// GET ALL TRANSACTION REGARDLESS WITHDRAWAL, DEPOSIT, GIFTING, SUBSCRIPTION
exports.allTransactions = async (req, res) => {
	try {
		const transactions = await Transaction.find().sort({ createdAt: -1 });
		res.status(200).json({
			status: "success",
			count: transactions.length,
			data: {
				transactions,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.getUserTransactionById = async (req, res) => {
	try {
		const { transactionID, userId } = req.params
		const userTransaction = await Transaction.findOne({ _id: transactionID, user: userId});
		res.status(200).json({
			status: "success",
			data: {
				transaction: userTransaction,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET ALL MY TRANSACTIONS REGARDLESS WITHDRAWAL, DEPOSIT, GIFTING, SUBSCRIPTION
exports.allMyTransactions = async (req, res) => {
	try {
		const myTransactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(80);

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET CURRENT USER'S WITHDRAWAL TRANSACTIONS
exports.myTransactionWithdrawals = async (req, res) => {
	try {
		// GET WITHDRAWAL TRANSACTIONS FOR THE CURRENT USER
		const myTransactions = await Transaction.find({
			user: req.user._id,
			purpose: "withdrawal",
		}).sort({ updatedAt: -1, createdAt: -1 });

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET CURRENT USER'S DEPOSIT TRANSACTIONS
exports.myTransactionDeposits = async (req, res) => {
	try {
		// GET DEPOSIT TRANSACTIONS FOR THE CURRENT USER
		const myTransactions = await Transaction.find({
			user: req.user._id,
			purpose: "deposit",
		}).sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET CURRENT USER'S SUBSCRIPTION TRANSACTIONS
exports.myTransactionSubscription = async (req, res) => {
	try {
		// GET DEPOSIT TRANSACTIONS FOR THE CURRENT USER
		const myTransactions = await Transaction.find({
			user: req.user._id,
			purpose: "subscription",
		}).sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET CURRENT USER'S GIFTING TRANSACTIONS
exports.myTransactiongifting = async (req, res) => {
	try {
		// GET DEPOSIT TRANSACTIONS FOR THE CURRENT USER
		const myTransactions = await Transaction.find({
			user: req.user._id,
			purpose: "gifting",
		}).sort({ updatedAt: -1, createdAt: -1 });

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};
