const mongoose = require('mongoose');
const slugify = require('slugify');


const productsCategorySchema = new mongoose.Schema({
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
    productCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});


productsCategorySchema.pre('save', function(next) {
    const slug = slugify(this.categoryName, { lower: true, replacement: '-' });
    this.slug = `${slug}-${this._id}`;
    next();
});

const ProductsCategory = mongoose.model("ProductCategory", productsCategorySchema);
module.exports = ProductsCategory;