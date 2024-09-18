const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    giftingPackageID: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Gifting',
        required: true
    },
    celebrant: {
        type: String,
        required: true
    },
    celebrantImage: String,
    purpose: String,
    amount: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        default: 1
    },
    contact: Number,
    country: String,
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
        // required: true
    },
    isPaidFor: {
        type: Boolean,
        default: false
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    isAcceptedOrder: {
        type: Boolean,
        default: false
    },
    isRejectedOrder: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'delivered'],
        default: 'pending'
    },
    deliveryCode: {
        type: Number,
    }
}, {
    timestamps: true,
});


orderSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'gifter',
        select: '_id image email fullName username'
    });
    this.populate({
        path: 'gift',
        select: '_id images name category'
    });
    this.populate({
        path: 'vendor',
        select: '_id image email location'
    });

    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;