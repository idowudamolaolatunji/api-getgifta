const mongoose = require('mongoose');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/userModel')

const wishListSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['birthday', 'wedding', 'anniversary', 'events'],
        default: 'events'
    },
    wishes: [],
    sharableUrl: String,
    shortSharableUrl: String,
    amountMade: {
        type: Number,
        default: 0,
    },
    contributors: {
        type: Number,
        default: 0,
    },
    slug: String,
}, {
    timestamps: true
})


wishListSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id email image fullName username'
    })
    next();
});


wishListSchema.pre('save', async function (next) {
    this.sharableUrl = `${this.user._id}-${this.category}-${this._id}`;
    next();
});


wishListSchema.pre('save', function(next) {
    const randomUUID16 = this.id.toString().slice(-12).match(/.{1,3}/g).join('-');
    const randomUUID4 = this._id.toString().slice(-4);


    const slug = slugify(this.name, { lower: true, replacement: '-' });
    this.slug = `${slug}-${randomUUID4}`;
    this.shortSharableUrl = randomUUID16;
    next();
});

const WishList = mongoose.model('WishList', wishListSchema);
module.exports = WishList;