const mongoose = require('mongoose');


const paymentLogSchema = new mongoose.Schema({
    wishList: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'WishList',
        required: true,
    },
    wish: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Wish',
        required: true,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
    },
    anonymous: {
        type: Boolean,
        require: true,
        default: false,
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        require: true
    },
    amount: {
        type: Number,
        require: true
    },
    message: {
        type: String,
        require: true
    },
    responseMessage: {
        type: String,
        default: ''
    },
    replyDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});


paymentLogSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'wishList',
        select: '_id name'
    });
    this.populate({
        path: 'wish',
        select: '_id wish'
    });
    this.populate({
        path: 'user',
        select: '_id fullName email username'
    });

    next();
})

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);
module.exports = PaymentLog;