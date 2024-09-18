const mongoose = require('mongoose');
const slugify = require('slugify');


const giftProductSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true 
    },
    name: {
        type: String,
        required: true,
        maxLength: [300, 'Gift name cannot be more than 300 words']
    },
    // image: {
    //     type: String,
    //     default: ''
    // },
    images: {
        type: [String],
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        // enum: ['arts', 'birthday', 'anniversary', 'hamper', 'custom', 'giftcard'],
        // default: 'custom'
    },
    slug: String,
    stockAvail: {
        type: Number,
        default: 0
    },
    
}, {
    timestamps: true,
});

giftProductSchema.pre('save', function(next) {
    const slug = slugify(this.name, { lower: true });
    this.slug = `${slug}-${this._id}`;
    next();
});
giftProductSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'vendor',
        select: '_id image email slug fullName location'
    });
    next();
});

const GiftProduct = mongoose.model('GiftProduct', giftProductSchema) ;
module.exports = GiftProduct;