const mongoose = require('mongoose');


const GiftaEarningSchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0
    }
});


const GiftaEarnings = mongoose.model('GiftaEarning', GiftaEarningSchema);
module.exports = GiftaEarnings;