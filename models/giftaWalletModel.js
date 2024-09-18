const mongoose = require('mongoose');


const giftaWalletSchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0,
        required: true
    }
});


const GiftaWallet = mongoose.model('GiftaWallet', giftaWalletSchema);
module.exports = GiftaWallet;