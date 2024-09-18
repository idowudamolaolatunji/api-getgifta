const mongoose = require('mongoose');


const giftedStickerSchema = new mongoose.Schema({
    gifter: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    sticker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalSticker',
        required: true,
    },
    stickerType: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


giftedStickerSchema.pre(/^find/, function(next) {

    this.populate({
        path: 'sticker',
        select: '_id image price'
    });

    next();
});

const GiftedSticker = mongoose.model('GiftedSticker', giftedStickerSchema);
module.exports = GiftedSticker;