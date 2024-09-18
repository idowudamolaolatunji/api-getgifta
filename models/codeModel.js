const mongoose = require('mongoose');


const codeSchema = new mongoose.Schema({
    digitalGift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalGift',
        required: true
    },
    boughtItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BoughtDigitalGift',
        default: null,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    },
    category: String,
    code: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});


codeSchema.pre(/^find/, function(next) {
	this.populate({
		path: "user",
		select: "_id email username fullName image",
	});
    this.populate({
        path: "digitalGift",
        select: "_id vendor name image quantity expiryDate price category"
    })
	next();
});



const Code = mongoose.model('Code', codeSchema);
module.exports = Code;