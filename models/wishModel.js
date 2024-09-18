const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema({
    wishList: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'WishList',
        required: true
    },
    wish: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    deadLineDate: {
        type: Date,
    },
    isPaidFor: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

wishSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'wishList',
        select: '_id'
    })
   
    next();
});

const Wish = mongoose.model('Wish', wishSchema);
module.exports = Wish;