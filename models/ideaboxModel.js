const mongoose = require('mongoose');


const ideaBoxSchema = new mongoose.Schema({
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
    },
}, {
    timestamps: true,
});



const IdeaBox = mongoose.model('IdeaBox', ideaBoxSchema);
module.exports = IdeaBox;