const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');

const ProductsCategory = require('../models/productsCategoryModel');
const GiftProduct = require('../models/giftProductModel');
const Notification = require('../models/NotificationModel');


exports.createCategory = async (req, res) => {
	try {
		const category = await ProductsCategory.create({
			categoryName: req.body.categoryName,
			categoryImage: req.body.categoryImage
		});

		res.status(201).json({
			status: 'success',
			data: {
				category,
			}
		});
	} catch(err) {
		return res.status(400).json({
            status: 'fail',
            message: err.message
        });
	}
}


// const categories = await GiftProduct.schema.path('category').enumValues;
exports.getAllCategories = async (req, res) => {
	try {
		// const categories = await ProductsCategory.find({ categoryName: { $ne: 'digital products' } });
		const categories = await ProductsCategory.find();
		res.status(200).json({
			status: 'success',
			data: {
				categories
			}
		});

	} catch(err) {
		return res.status(400).json({
            status: 'fail',
            message: err.message
        });
	}
}


// VENDORS UPLOAD PRODUCTS
exports.createGiftProduct = async (req, res) => {
    try {
        const vendor = await User.findById(req.user._id);
        if(!vendor || !vendor.isActive) return res.json({
            message: 'User no longer exist'
        });
		if(vendor.role !== 'vendor') return res.json({
			message: 'You\'re not authorized to upload a Gift Product',
		});

        const newGiftProduct = await GiftProduct.create({
            vendor: vendor._id,
            name: req.body.name,
            // image: req.body.image,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category || 'custom',
            stockAvail: req.body.stockAvail,
        });

		await ProductsCategory.findOneAndUpdate(
			{ categoryName: req.body.category },
			{ $inc: { productCount: 1 } },
			{ runValidators: true, new: true }
		);

		await Notification.create({
			user: vendor?._id,
			title: 'Created Gift Product!',
			content: `You just created a new product in ${newGiftProduct?.category}!`
		});

        res.status(201).json({
            status: 'success',
            message: 'Product created!',
            data: {
                product: newGiftProduct,
            }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


// ADD GIFTING IMAGES
exports.uploadProductImg = async (req, res) => {
    try {
        
		const product = await GiftProduct.findById(req.params.id);
		if(!product) return res.json({
			message: 'Cannot find product'
		});		

		const images = [];
		if (req?.files && Array.isArray(req.files)) {
			for (const image of req.files) {
				const fileName = `product-${product?._id}-${Date.now()}-${images.length + 1}.jpeg`
				await sharp(image.buffer)
					.resize(950, 950)
					.toFormat('jpeg')
					.jpeg({ quality: 80 })
					.toFile(`public/asset/products/${fileName}`)
				;
				images.push(fileName);
			}
		}

		console.log(images)
		product.images = images;
		await product.save({});

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


// EVERY GIFT PRODUCTS
exports.getAllGiftProducts = async (req, res) => {
	try {
		const giftProducts = await GiftProduct.find().sort({ createdAt: -1 });
		res.status(200).json({
			status: 'success',
			count: giftProducts.length,
			data: {
				giftProducts
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// GET ONE GIFT PRODUCT
exports.getGiftProductById = async (req, res) => {
    try {
        const giftProduct = await GiftProduct.findById(req.params.productID);
		res.status(200).json({
			status: 'success',
			data: {
				giftProduct
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// FIND GIFT PRODUCTS BY CATEGORIES
exports.getGiftProductsByCategories = async (req, res) => {
    try {
        const giftProducts = await GiftProduct.find({ category: req.params.category, vendor: { $ne: req.user._id } }).sort({ createdAt: -1 });
		res.status(200).json({
            status: 'success',
            count: giftProducts.length,
			data: {
				giftProducts
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}
exports.getGiftProductsByCategoriesAll = async (req, res) => {
    try {
        const giftProducts = await GiftProduct.find({ category: req.params.category }).sort({ createdAt: -1 });
		res.status(200).json({
            status: 'success',
            count: giftProducts.length,
			data: {
				giftProducts
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// CURRENT VENDOR GIFT PRODUCTS
exports.allMyProducts = async (req, res) => {
	try {
		const giftProducts = await GiftProduct.find({ vendor: req.user._id }).sort({ createdAt: -1 });
        
        if(!giftProducts || giftProducts.length < 1) {
            return res.json({
                message: 'You have no Gift product'
            });
        }

		res.status(200).json({
			status: 'success',
			count: giftProducts.length,
			data: {
				giftProducts
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}



// UPDATE GIFT PRODUCT
exports.updateGiftProduct = async (req, res) => {
    try {
		const vendor = await User.findById(req.user._id);
		if(!vendor || !vendor.isActive) return res.json({ message: 'Vendor not found!' });
        const giftProduct = await GiftProduct.findOneAndUpdate(
			{ _id: req.params.productID, vendor: vendor._id },
			req.body,
			{ runValidators: true, new: true }
		);

		await Notification.create({
			user: vendor?._id,
			title: 'Updated Gift Product!',
			content: `You just created a product in ${giftProduct.category}!`
		});

		res.status(200).json({
			status: 'success',
			message: 'Updated product successfully!',
			data: {
				product: giftProduct
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


// DELETE GIFT PRODUCT
exports.deleteGiftProduct = async (req, res) => {
    try {
		const vendor = await User.findById(req.user._id);
		if(!vendor || !vendor.isActive) return res.json({ message: 'Vendor not found!' });

		const product = await GiftProduct.findOne({ _id: req.params.productID, vendor: vendor._id })
		if(!product) return res.json({ message: 'No product found' });

        await GiftProduct.findByIdAndDelete(product._id);
		await ProductsCategory.findOneAndUpdate(
			{ categoryName: product.category },
			{ $inc: { productCount: -1 } },
			{ runValidators: true, new: true }
		);

		await Notification.create({
			user: vendor?._id,
			title: 'Deleted Gift Product!',
			content: `You just deleted a product in ${product.category}!`
		});

		res.status(200).json({
			status: 'success',
			message: 'Deleted a product successfully',
			data: {}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}