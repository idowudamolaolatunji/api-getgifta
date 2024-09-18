const mongoose = require("mongoose");

const digitalGiftSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: "",
    },
    quantity: {
        type: Number,
        required: true,
    },
    pin: Number,
    expiryDate: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
    },
    quantity: Number,
    category: String,
    slug: String,
    // codes: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Code" }],
},
{
    timestamps: true,
});

digitalGiftSchema.pre(/^find/, function(next) {
	this.populate({
		path: "vendor",
		select: "_id email username fullName image",
	});
	// this.populate("codes");
	next();
});

const DigitalGift = mongoose.model("DigitalGift", digitalGiftSchema);
module.exports = DigitalGift;
