const mongoose = require('mongoose');


const boughtStickerSchema = new mongoose.Schema({
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


boughtStickerSchema.pre(/^find/, function(next) {

    this.populate({
        path: 'sticker',
        select: '_id image price'
    });

    next();
})


const BoughtSticker = mongoose.model('BoughtSticker', boughtStickerSchema);
module.exports = BoughtSticker