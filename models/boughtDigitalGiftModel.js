const mongoose = require('mongoose');


const boughtDigitalGiftSchema = new mongoose.Schema({
    digitalGift: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'DigitalGift',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    category: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});



boughtDigitalGiftSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id email image fullName' 
    });

    this.populate({
        path: 'digitalGift',
        select: '_id image code name expiryDate status category price'
    });

    next();
});


const BoughtDigitalGift = mongoose.model('BoughtDigitalGift', boughtDigitalGiftSchema);
module.exports = BoughtDigitalGift;