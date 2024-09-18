const mongoose = require('mongoose');
const slugify = require('slugify');


const digitalGiftCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    categoryImage: {
        type: String,
        required: true,
    },
    slug: String,
    giftCounts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});


digitalGiftCategorySchema.pre('save', function(next) {
    const slug = slugify(this.categoryName, { lower: true, replacement: '-' });
    this.slug = `${slug}-${this._id}`;
    next();
});

const DigitalGiftsCategory = mongoose.model("DigitalGiftCategory", digitalGiftCategorySchema);
module.exports = DigitalGiftsCategory;