const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        // unique: true
    },
    status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'pending'
    },
    purpose: {
        type: String,
        enum: ['deposit', 'withdrawal', 'gifting', 'subscription', 'order', 'wishes', 'redeemed'],
        default: 'deposit',
        required: true
    },
    charged: {
        type: Boolean,
        default: false,
        required: true,
    },
    paidAt: { type: Date },
}, {
    timestamps: true,
});

transactionSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: '_id email image fullName',
    });
    next();
});


const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;