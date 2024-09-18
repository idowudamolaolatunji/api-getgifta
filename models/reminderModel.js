const mongoose = require('mongoose');


const reminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['events', 'wedding', 'anniversary', 'birthday'],
        default: 'events',
        required: true
    },
    reminderMessage: {
        type: String,
        default: ''
    },
    reminderDate: {
        type: Date,
        required: true
    },
    // image: {
    //     type: String,
    //     default: ''
    // },
    reminderTime: {
        type: String,
        required: true
    },
    sendMessage: {
        type: Boolean,
        // required: true,
        default: false
    },
    sendThrough: {
        type: String,
        enum: ["email", "sms", ""],
        default: ""
    },
    emailAddress: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    status: {
        type:String,
        enum: ['sent', 'unsent'],
        default: 'unsent'
    },
    addedGift: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Gifting'
    }
}, {
    timestamps: true,
});


// 
reminderSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id email image username'
    });
    this.populate({
        path: 'addedGift',
        select: '_id email image username'
    });

    next();
});

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;