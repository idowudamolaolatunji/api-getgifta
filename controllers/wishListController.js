const WishList = require("../models/wishListModel");
const Wish = require("../models/wishModel");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");

const numberConverter = require('../utils/numberConverter');

// CREATE WISHLIST
exports.createWishList = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user || !user.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		// CHECK IF THERE ARE ALREADY WISHLIST AND IF THERE NOT MORE THAN 3
		const previousWishLists = await WishList.find({ user: user._id });
		if (!user.isPremium && previousWishLists.length < 3) {
			const wishList = await WishList.create({
				user: user._id,
				name: req.body.name,
				category: req.body.category,
			});
			const newNotification = await Notification.create({
				user: user._id,
				title: 'New WishList Created!',
				content: `You just created a wishlist.`
			});
			return res.status(200).json({
				status: "success",
				message: "WishList Created!",
				data: {
					wishList,
					newNotification
				},
			});
		} else if (!user.isPremium && previousWishLists.length === 3) {
			return res.json({
				message: "You have exhausted your wish list, Subscribe to upload more wish lists",
			});
		}

		const wishList = await WishList.create({
			user: user._id,
			name: req.body.name,
			category: req.body.category,
		});
		console.log(true);

		const newNotification = await Notification.create({
			user: user._id,
			title: 'New WishList Created!',
			content: `You just created a wishlist.`
		});

		res.status(200).json({
			status: "success",
			message: "WishList Created!",
			data: {
				wishList,
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

// ADD IMAGES
exports.uploadWishlistImg = async (req, res) => {
	try {
		let image;
		if (req.file) image = req.file.filename;
		const wishlistID = req.params.id;

		const updated = await WishList.findByIdAndUpdate(
			wishlistID,
			{ image },
			{
				new: true,
				runValidators: true,
			},
		);

		res.status(200).json({
			status: "success",
			data: {
				wistList: updated,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// CREATE WISHES
exports.createWishes = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user || !user.isActive)
			return res.json({
				message: "Cannot find user!",
			});

		const wishList = await WishList.findOne({ _id: req.params.wishlistID, user: req.user._id });
		if (!wishList || wishList.length < 1)
			return res.json({
				message: "Cannot find wishlist!",
			});

		// CHECK IF THERE ARE ALREADY WISHLIST AND IF THERE NOT MORE THAN 3
		const previousWishes = await Wish.find({ wishList: wishList._id });
		if (!user.isPremium && previousWishes.length < 10) {
			const wish = await Wish.create({
				wishList: wishList._id,
				wish: req.body.wish,
				description: req.body.description,
				amount: req.body.amount,
				deadLineDate: req.body.deadLineDate,
			});

			wishList.wishes.push(wish);
			await wishList.save({});

			const newNotification = await Notification.create({
				user: user._id,
				title: 'New Wish Created!',
				content: `You just created a new wish.`
			});

			res.status(200).json({
				status: "success",
				message: "Wish created!",
				data: {
					wishList,
					newNotification
				},
			});
			return;
		}

		if (!user.isPremium && previousWishes.length === 10) {
			return res.status(400).json({
				message: "You have exhausted your wish, Subscribe to upload more Wishes",
			});
		}

		const wish = await Wish.create({
			wishList: wishList._id,
			wish: req.body.wish,
			description: req.body.description,
			amount: req.body.amount,
			deadLineDate: req.body.deadLineDate,
		});

		wishList.wishes.push(wish);
		await wishList.save();

		const newNotification = await Notification.create({
			user: user._id,
			title: 'New Wish Created!',
			content: `You just created a new wish.`
		});

		res.status(200).json({
			status: "success",
			message: "Wish created!",
			data: {
				wishList,
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

// GET ALL WISHLISTS
exports.geteveryWishlist = async (req, res) => {
	try {
		const wishLists = await WishList.find().sort({ updatedAt: -1 });
		if (!wishLists || wishLists.length < 1)
			return res.json({
				message: "No Wish list found!",
			});

		res.status(200).json({
			status: "success",
			count: wishLists.length,
			data: {
				wishLists,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET ALL MY WISHLISTS
exports.getMyWishlists = async (req, res) => {
	try {
		const wishLists = await WishList.find({ user: req.user._id }).sort({ updatedAt: -1 });
		if (!wishLists || wishLists.length < 1)
			return res.json({
				message: "No Wish list found!",
			});
		console.log(wishLists.length);

		res.status(200).json({
			status: "success",
			count: wishLists.length,
			data: {
				wishLists,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET WISHLIST BY ID
exports.getWishlistById = async (req, res) => {
	try {
		const wishList = await WishList.findOne(req.params.wishListID);
		if (!wishList)
			return res.json({
				message: "No Wish list found!",
			});

		res.status(200).json({
			status: "success",
			data: {
				wishList,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET WISHLIST BY SHARED URL
exports.getSharedWishlist = async (req, res) => {
	try {
		const wishList = await WishList.findOne({ shortSharableUrl: req.params.sharedUrl });
		// console.log(wishList);

		if (!wishList)
			return res.json({
				message: "No Wish list found!",
			});

		res.status(200).json({
			status: "success",
			data: {
				wishList,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

exports.getWishesByWishListId = async (req, res) => {
    try {
        const wishes = await Wish.find({ wishList: req.params.wishListID }).sort({ createdAt: -1 });
        if (!wishes || wishes.length === 0) {
			return res.json({
				message: "No Wish list found!",
			});
        }

        res.status(200).json({
			status: "success",
            count: wishes.length,
			data: {
				wishes,
			},
		});
    } catch(err) {
        return res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}

// GET WISHLIST BY SLUG
exports.getWishlistBySlug = async (req, res) => {
	try {
		const wishList = await WishList.findOne({
			user: req.user._id,
			slug: req.params.wishlistSlug,
		});
		if (!wishList)
			return res.json({
				message: "No Wish list found!",
			});

		res.status(200).json({
			status: "success",
			data: {
				wishList,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// UPDATE WISHlIST
exports.updateWishList = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find current user!",
			});

		// LIMIT A NON PREMIEM USER FROM UPDATING THE WISHLIST
		if (!currentUser.isPremium) {
			return res.json({
				message: "You cannot perfom this task, Upgrade Account!",
			});
		}

		// ALLOW PREMIUM USER TO UPDATE
		if (currentUser.isPremium) {
			const wishList = await WishList.findByIdAndUpdate(req.params.wishListID, req.body, {
				runValidators: true,
				new: true,
			});

			const newNotification = await Notification.create({
				user: currentUser.id,
				title: 'Updated Wishlist!',
				content: `You just updated a wishlist.`
			});

			res.status(200).json({
				status: "success",
				message: "WishList updated!",
				data: {
					wishList,
					newNotification
				},
			});
		}
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// UPDATE WISH
exports.updateWish = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find current user!",
			});

		// LIMIT A NON PREMIEM USER FROM UPDATING THE WISH
		if (!currentUser.isPremium) {
			return res.json({
				message: "You cannot perfom this task, Upgrade Account!",
			});
		}

		// ALLOW PREMIUM USER TO UPDATE
		if (currentUser.isPremium) {
			const wishList = await WishList.findById(req.params.wishListID);
			const wish = await Wish.findOneAndUpdate(
				{ _id: req.params.wishID, wishList: wishList._id },
				req.body,
				{
					runValidators: true,
					new: true,
				},
			);

			// Find the index of the wish in the wishes array
			const wishIndex = wishList.wishes.findIndex((wish) =>
				wish._id.equals(req.params.wishID),
			);
			if (wishIndex === -1) {
				return res.json({
					message: "Wish not found in the wish list!",
				});
			}

			// Update the wish properties dynamically based on the request body
			Object.keys(req.body).forEach((key) => {
				wishList.wishes[wishIndex][key] = req.body[key];
			});
			await wishList.save();

			const newNotification = await Notification.create({
				user: currentUser.id,
				title: 'Updated Wish!',
				content: `You just updated a wish.`
			});

			res.status(200).json({
				status: "success",
				message: "Wish updated!",
				data: {
					wish: {
						wish,
						wishItem: wishList.wishes[wishIndex],
					},
					newNotification,
				},
			});
		}
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// DELETE WISHlIST
exports.deleteWishList = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive) {
			return res.json({
				message: "Cannot find current user!",
			});
		}

		// LIMIT A NON PREMIEM USER FROM DELETING THE WISHLIST
		if (!currentUser.isPremium) {
			return res.json({
				message: "You cannot perfom this task, Upgrade Account!",
			});
		}

		// ALLOW PREMIUM USER TO DELETE
		// if (currentUser.isPremium) {
			await WishList.findByIdAndDelete(req.params.wishListID);
			await Wish.deleteMany({ wishList: req.params.wishListID });

			await Notification.create({
				user: currentUser.id,
				title: 'Deleted Wishlist!',
				content: `You just deleted a wishlist.`
			});

			res.status(200).json({
				status: "success",
				message: "WishList deleted!",
				data: null,
			});
		// }
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// DELETE WISH
exports.deleteWish = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id);
		if (!currentUser || !currentUser.isActive)
			return res.json({
				message: "Cannot find current user!",
			});

		// LIMIT A NON PREMIEM USER FROM DELETING THE WISH
		if (!currentUser.isPremium) {
			return res.json({
				message: "You cannot perfom this task, Upgrade Account!",
			});
		}


		// ALLOW PREMIUM USER TO DELETE
			const wishList = await WishList.findById(req.params.wishListID);
			const deletedWish = await Wish.findOneAndDelete({
				_id: req.params.wishID,
				wishList: req.params.wishListID,
			});

			if (!deletedWish) {
				return res.json({
					message: "Wish not found in the wish list!",
				});
			}

			// Find the index of the wish in the wishes array
			const wishIndex = wishList.wishes.findIndex((wish) =>
				wish._id.equals(req.params.wishID),
			);

			// Check if the wish exists in the wish list
			if (wishIndex === -1) {
				return res.json({
					message: "Wish not found in the wish list!",
				});
			}

			// Remove the wish from the wishes array
			wishList.wishes.splice(wishIndex, 1);
			await wishList.save();

			await Notification.create({
				user: currentUser.id,
				title: 'Deleted Wish!',
				content: `You just deleted a wish.`
			});

			res.status(200).json({
				status: "success",
				message: "Wish deleted!",
				data: null,
			});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

//////////////////////////////////////////////////////////////
const verifyPayment = require("../utils/verifyPayment");
const Transaction = require("../models/transactionModel");
const Notification = require("../models/NotificationModel");
const PaymentLog = require("../models/PaymentLogModel");
const grantedWishResponseEmail = require("../utils/emailTemplates/grantedWishResponseEmail");
const GiftaEarnings = require("../models/earningsModel");

exports.payForWish = async (req, res) => {
	try {
		const { reference, charges } = req.params;
		const { wishListID, wishID, userID } = req.body;

		// FIND THE CURRENT USER
		const currentUser = await User.findById(userID);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}

		const wishList = await WishList.findOne({ _id: wishListID, user: userID });
		if (!wishList) {
			return res.status(400).json({ message: "Wishlist not found" });
		}
		const wish = await Wish.findOne({ _id: wishID, wishList: wishListID });
		if (!wish) {
			return res.status(400).json({ message: "Wish not found" });
		}

		// VERIFY PAYSTACK PAYMENT WITH THE REFERNECE PARAMS
		const paymentVerification = await verifyPayment(reference);
		// GET THE RESPONSE DATA
		const response = paymentVerification?.data.data;
		console.log(response);

		// HANDLE PAYMENT VERIFICATION STATUS
		if (paymentVerification.status !== 200) {
			return res.status(400).json({
				status: "fail",
				message: "Unable to verify payment",
			});
		}

		const giftaProfit = Number(paidAmount * 0.05);
		const paidAmount = Number(Number(response.amount) / 100 - charges);
		const chargedAmount = paidAmount - giftaProfit;

		// Update amountMade in the wishlist schema
		wishList.amountMade += chargedAmount;
		wishList.contributors += 1;
		wish.amountPaid += chargedAmount;
		wish.isPaidFor = wish.amountPaid >= wish.amount;

		await wish.save({});
		await wishList.save({});

		const userWallet = await Wallet.findOne({ user: userID });
		userWallet.walletBalance += chargedAmount;
		await userWallet.save({});
		
        const GiftaWallet = await GiftaEarnings.findById(process.env.GIFTA_EARNINGS_DOC_ID);
		GiftaWallet.balance += giftaProfit;
		await GiftaWallet.save({});

		// CREATE LOG DOCUMENT
		const payLog = await PaymentLog.create({
			wishList: wishList._id,
			wish: wish._id,
			user: currentUser.id,
			anonymous: req.body.anonymous,
			name: req.body.payerName,
			email: req.body.payerEmail,
			amount: paidAmount,
			message: `${req.body.anonymous ? 'Anonymous' : req.body.payerName} paid ₦${numberConverter(paidAmount)} for your wish!`,
		});
		

		// CREATE TRANSACTION DOCUMENT
		const wishTransaction = await Transaction.create({
			user: currentUser.id,
			amount: chargedAmount,
			reference: response.reference,
			status: "success",
			purpose: "wishes",
			charged: true,
		});

		// CREATE NOTIFICATION DOCUMENT
		 await Notification.create({
			user: currentUser.id,
			title: 'New Paid Wish!',
			content: `Someone just granted a potion of your wish, Gifta's 5% was deducted`,
		});

		return res.status(200).json({
			status: "success",
			message: "Payment successful",
			data: {
				transaction: wishTransaction,
				log: payLog
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.getAllCurrUserWishListPaymentLogs = async (req, res) => {
	try {
		const { wishListId } = req.params;
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}
		const wishlistLogs = await PaymentLog.find({ user: currentUser._id, wishList: wishListId }).sort({ createdAt: -1 });
		return res.status(200).json({
			status: "success",
			data: {
				wishlistLogs
			},
		});
	} catch(err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}



exports.getAllCurrUserWishPaymentLogs = async (req, res) => {
	try {
		const { wishId } = req.params;
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.json({
				message: "User Not Found!",
			});
		}
		const wishLogs = await PaymentLog.find({ user: currentUser._id, wish: wishId }).sort({ createdAt: -1 });
		return res.status(200).json({
			status: "success",
			data: {
				wishLogs
			},
		});
	} catch(err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}


exports.respondMessageToPaymentLog = async (req, res) => {
	try {
		const { email, id, responseMessage, replyDate } = req.body;
		const currentUser = await User.findById(req.user._id);
		if (!currentUser) {
			return res.status(404).json({
				message: "User Not Found!",
			});
		}
		const logDoc = await PaymentLog.findOneAndUpdate(
			{ _id: id, user: req.user._id },
			{ responseMessage, replyDate },
			{ new: true, runValidators: true }
		);
		if (!logDoc) {
			return res.status(404).json({
				message: "Payment Log Not Found!",
			});
		}
		console.log(logDoc, currentUser);

		res.status(200).json({
			status: 'success',
			data: {
				logDoc
			}
		});

		const message = grantedWishResponseEmail(logDoc?.user?.fullName, responseMessage)
		return await sendEmail({
            email,
            subject: `Appreciation From ${logDoc?.user?.fullName || logDoc?.user?.username} For Contribution`,
            message,
        });

	} catch(err) {
		console.log(err);
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}