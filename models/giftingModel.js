const mongoose = require('mongoose');

const giftingSchema = new mongoose.Schema({
    gifter: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    gift: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'GiftProduct',
        required: true
    },
    vendor: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    celebrantImage: String,
    purpose: {
        type: String,
        required: true,
    },
    celebrant: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    description: String,
    attached: String,
    contact: Number,
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    deliveryDate: {
        type: Date,
        required: true
    },
    isPaidFor: {
        type: Boolean,
        default: false
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    isRejected: {
        type: Boolean,
        default: false
    },
    deliveryCode: Number,
}, {
    timestamps: true,
});


giftingSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'gifter',
        select: '_id image email'
    });
    this.populate({
        path: 'gift',
        select: '_id images name'
    });
    this.populate({
        path: 'vendor',
        select: '_id image email'
    });

    next();
});

const Gifting = mongoose.model('Gifting', giftingSchema);
module.exports = Gifting;

