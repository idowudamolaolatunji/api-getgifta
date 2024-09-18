const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    duration: {
        type: String,
        enum: ['not-sub', 'monthly', 'semi-annual', 'annual'],
        default: 'not-sub',
    },
    expirationDate: {
        type: Date,
        required: true
    },
}, {
    timestamps: true
});


subscriptionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id email image username'
    });

    next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;