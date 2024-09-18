const mongoose = require('mongoose');

const digitalStickerSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});


const DigitalSticker = mongoose.model('DigitalSticker', digitalStickerSchema);
module.exports = DigitalSticker;