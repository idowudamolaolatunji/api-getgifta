const User = require("../models/userModel");
const DigitalGift = require("../models/digitalGiftModel");
const DigitalGiftsCategory = require("../models/digitalGiftCategoryModel");
const Wallet = require("../models/walletModel");
const capitalizeFirstLetter = require("../utils/capitalizeFirstLetter");
const BoughtDigitalGift = require("../models/boughtDigitalGiftModel");
const Code = require("../models/codeModel");
const Notification = require("../models/NotificationModel");

exports.createDigitalGiftCategory = async (req, res) => {
	try {
		const category = await DigitalGiftsCategory.create({
			categoryName: req.body.categoryName,
			categoryImage: req.body.categoryImage,
		});

		res.status(201).json({
			status: "success",
			data: {
				category,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

exports.getAllCategories = async (req, res) => {
	try {
		const categories = await DigitalGiftsCategory.find();
		res.status(200).json({
			status: "success",
			data: {
				categories,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

exports.createDigitalGift = async (req, res) => {
	try {
		const vendor = await User.findById(req.user._id);
		if (!vendor || !vendor.isActive)
			return res.json({
				message: "Vendor no longer exist",
			});

		const newDigitalGift = await DigitalGift.create({
			vendor: vendor._id,
			name: req.body.name,
			image: req.body.image,
			quantity: req.body.quantity,
			// codes: req.body.codes,
			price: req.body.price,
			pin: req.body.pin,
			expiryDate: req.body.expiryDate,
			category: req.body.category,
		});

		//store the codes
		let requestCodes = req.body.codes;
		let codesArray = [];

		requestCodes.map((i) => {
			let obj = {
				digitalGift: newDigitalGift._id,
				user: null,
				code: i,
			};
			codesArray.push(obj);
		});

		//store codes array

		const newCodes = await Code.insertMany(codesArray);

		await DigitalGiftsCategory.findOneAndUpdate({ categoryName: req.body.category }, { $inc: { giftCounts: 1 } }, { runValidators: true, new: true });

		await Notification.create({
			user: vendor?._id,
			title: `Created new ${newDigitalGift?.category}!`,
			content: `You just created a Digital gift ${newDigitalGift?.category}!`,
		});

		res.status(201).json({
			status: "success",
			message: `${newDigitalGift?.category} created!`,
			data: {
				digitalGift: newDigitalGift,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// ADD GIFTING IMAGES
exports.uploadImg = async (req, res) => {
	try {
		let image;
		if (req.file) image = req.file.filename;

		await DigitalGift.findByIdAndUpdate(
			req.params.id,
			{ image },
			{
				new: true,
				runValidators: true,
			},
		);

		res.status(200).json({
			status: "success",
			message: "Image upload successful",
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// EVERY GIFT PRODUCTS
exports.getAllDigitalGifts = async (req, res) => {
	try {
		const digitalGift = await DigitalGift.find().sort({ createdAt: -1 });
		res.status(200).json({
			status: "success",
			count: digitalGift.length,
			data: {
				digitalGift,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// GET ONE GIFT PRODUCT
exports.getDigitalGiftById = async (req, res) => {
	try {
		const digitalGift = await DigitalGift.findById(req.params.id);
		res.status(200).json({
			status: "success",
			data: {
				digitalGift,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// FIND GIFT PRODUCTS BY CATEGORIES
exports.getDigitalGiftsByCategories = async (req, res) => {
	try {
		const digitalGifts = await DigitalGift.find({
			category: req.params.category,
			user: { $ne: req.user._id },
		}).sort({ createdAt: -1 });
		res.status(200).json({
			status: "success",
			count: digitalGifts.length,
			data: {
				digitalGifts,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


/////////////////////////////////////////////////// UPDATE GIFT Item ///////////////////
exports.updateDigitalGifts = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user || !user.isActive) return res.json({ message: "User not found!" });

		const digitalGift = await DigitalGift.findOneAndUpdate({ _id: req.params.id, user: user._id }, req.body, { runValidators: true, new: true });

		await Notification.create({
			user: user?._id,
			title: "Updated digital gift!",
			content: `You just updated a digital gift ${digitalGift?.category}!`,
		});

		res.status(200).json({
			status: "success",
			message: "Updated product successfully!",
			data: {
				digitalGift,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

// DELETE GIFT Item
exports.deleteDigitalGift = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user || !user.isActive) return res.json({ message: "User not found!" });

		const digitalGift = await DigitalGift.findOne({
			_id: req.params.id,
			user: user._id,
		});
		if (!digitalGift) return res.json({ message: "No digital gift found!" });

		await DigitalGift.findByIdAndDelete(digitalGift?._id);
		await DigitalGiftsCategory.findOneAndUpdate({ categoryName: digitalGift?.category }, { $inc: { giftCounts: -1 } }, { runValidators: true, new: true });

		await Notification.create({
			user: user?._id,
			title: `Deleted ${digitalGift?.category}`,
			content: `You just deleted a digital gift ${digitalGift?.category}!`,
		});

		res.status(200).json({
			status: "success",
			message: "Deleted a digital gift successfully",
			data: {},
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};
/////////////////////////////////////////////////////////////////////////////////////




exports.purchaseDigitalItem = async (req, res) => {
	try {
		//collected from frontend
		const quantityOrdered = req.body.quantity;

		const currUser = await User.findById(req.user._id);
		if (!currUser || !currUser.isActive) {
			return res.json({
				message: "Cannot find user",
			});
		}

		const item = await DigitalGift.findById(req.params.productId);
		//check if the quantity is enough
		if (item.quantity < quantityOrdered) {
			return res.json({
				message: "Item quantity is not enough",
			});
		}

		const currUserWallet = await Wallet.findOne({ user: currUser?._id });

		if (currUserWallet.walletBalance < item?.price) {
			await Notification.create({
				user: currUser._id,
				title: "Insufficient 🤯 Wallet Balance",
				content: `Deposit to your wallet to purchase this ${capitalizeFirstLetter(item.category)} 😊`,
			});
			return res.json({
				message: "Insufficient wallet Balance",
			});
		}

		//time for deductions based on quantity

		currUserWallet.walletBalance -= item?.price * quantityOrdered;
		await currUserWallet.save();

		item.quantity -= quantityOrdered;
		await item.save();

		// create a purchased document
		const purchaseDigitalItem = await BoughtDigitalGift.create({
			digitalGift: item?._id,
			quantity: quantityOrdered,
			user: currUser._id,
            category: item.category
		});

		const codes = await Code.find({ digitalGift: item._id, user: null }).limit(quantityOrdered);
		for (let i = 0; i < codes.length; i++) {
			const code = codes[i];
			await Code.updateOne(
				{ _id: code._id }, // Specify the ID of the code to update
				{ $set: { user: req.user._id, boughtItem: purchaseDigitalItem._id } }, // Set the user field to req.user._id
			);
		}

		await Notification.create({
			user: currUser._id,
			title: `Purchased ${item?.category} item!`,
			content: `You just purchased ${quantityOrdered} ${capitalizeFirstLetter(item?.category)} items for ₦${item?.price * quantityOrdered}`,
		});

		res.status(200).json({
			status: "success",
			message: `${capitalizeFirstLetter(item?.category)} Purchase Successfully!`,
			data: {
				item: purchaseDigitalItem,
			},
		});
	} catch (err) {
		res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};




// CURRENT user GIFT Items
exports.allMyPurchasedDigitalItems = async (req, res) => {
	try {
		const items = await BoughtDigitalGift.find({ user: req.user._id }).sort({
			createdAt: -1,
		});

		if (!items || items.length < 1) {
			return res.json({
				message: "You have no digital item",
			});
		}

		res.status(200).json({
			status: "success",
			count: items.length,
			data: {
				items,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

exports.allMyPurchasedItemByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const items = await BoughtDigitalGift.find({ user: req.user._id, category }).sort({
			createdAt: -1,
		});

		res.status(200).json({
			status: "success",
			count: items.length,
			data: {
				items,
			},
		});

    } catch(err) {
        res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}
exports.getCodes = async (req, res) => {
    try {
        const { digitalGiftId, boughtItemId } = req.params;

        const codes = await Code.find({ user: req.user._id, digitalGift: digitalGiftId, boughtItem: boughtItemId }).sort({
          createdAt: -1,
        });
    
        
		res.status(200).json({
			status: "success",
			count: codes.length,
			data: {
				codes,
			},
		});

    } catch(err) {
        res.status(400).json({
			status: "fail",
			message: err.message,
		});
    }
}