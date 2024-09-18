const mongoose = require('mongoose');
const slugify = require('slugify');


const ideaBoxCategorySchema = new mongoose.Schema({
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
    ideaCounts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});

const IdeaBoxCategory = mongoose.model("IdeaBoxCategory", ideaBoxCategorySchema);
module.exports = IdeaBoxCategory;