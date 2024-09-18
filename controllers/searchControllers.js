
const GiftProduct = require('../models/giftProductModel');
const Gifting = require('../models/giftingModel');
const Wishlist = require('../models/wishListModel');
const Wish = require('../models/wishModel');
const Reminder = require('../models/reminderModel');

/////////////////////////////////////////////////////
const User = require('../models/userModel');
/////////////////////////////////////////////////////


exports.searchOnGifta = async function(req, res) {
    try {
        const { query } = req.query;
        const userId = req.user.id;
        console.log(query);

        // FIND SEARCHED QUERY
        const giftProductResults = await GiftProduct.find({ name: { $regex: new RegExp(query, 'i') }});
        const userWishlistResults = await Wishlist.find({ user: userId, name: { $regex: new RegExp(query, 'i') }});
        const userWishResults = await Wish.find({ user: userId, wish: { $regex: new RegExp(query, 'i') }});
        const userReminderResults = await Reminder.find({ user: userId, title: { $regex: new RegExp(query, 'i') }});
        const userGiftingResults = await Gifting.find({ gifter: userId, celebrant: { $regex: new RegExp(query, 'i') }});

        const results = {
            products: giftProductResults,
            wishLists: userWishlistResults,
            wishes: userWishResults,
            reminders: userReminderResults,
            giftings: userGiftingResults,
        };

        res.status(200).json({
            status: 'success',
            data: {
                results
            }   
        });
    } catch(err) {
        console.log(err.message);
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}



exports.searchUsersByUsername = async function (req, res) {
    try {
        const { query } = req.query;
        const userId = req.user.id;
        console.log(query);

        const currUser = await User.findById(userId);
        if(!currUser || !currUser.isActive) {
            return res.json({
                message: 'You don\'t have access to searching for a user'
            })
        }

        // FIND SEARCHED QUERY
        const userSearchResults = await User.find({ username: { $regex: new RegExp(query, 'i') }});
        if(!userSearchResults || userSearchResults.length < 1) {
            return res.json({
                message: 'Cannot find any user with this username'
            })
        }

        res.status(200).json({
            status: 'success',
            data: {
                results: userSearchResults
            }   
        });
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}