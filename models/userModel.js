const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        validate: [validator.isEmail, "Enter a valid email"],
        lowercase: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password are not the same!'
        },
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullName: String,
    image: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'vendor'],
        default: 'user',
    },
    otpCode: {
        type: Number,
        required: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumDuration: {
        type: String,
        enum: [null, 'half', 'full'],
        default: null
    },
    location: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isOTPVerified: {
        type: Boolean,
        default: false
    },
    isKycVerified: {
        type: Boolean,
        default: false
    },
    slug: String,
    otpExpiresIn: Date,
    pushToken: {
        type: String,
        default: '',
    },
    referralCode: {
        type: String,
    },
    myInviterCode: {
		type: String,
		default: null
	},
	referralsList: {
		type: mongoose.SchemaTypes.Array,
        default: [],
	},
	referralsCount: { type: Number, default: 0 },
    //////////////////////
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetEpires: Date,
    /////////////////////////////////
    bankName: { type: String, default: '' },
    acctNumber: { type: Number, default: '' },
    holderName: { type: String, default: '' },
}, {
    timestamps: true
});


// SCHEMA MIDDLEWARES
const saltRound = 12;
userSchema.pre('save', async function(next) {
    // CHECK IF PASSWORD IS ALREADY MODIFIED
    if(!this.isModified('password')) return next();

    // IF NOT HAS THE PASSWORD
    const hashedPassword = await bcrypt.hash(this.password, saltRound);
    this.password = hashedPassword;
    this.passwordConfirm = undefined

    next();
});


userSchema.pre("save", function (next) {
    // CREATING USER SLUG AND LINK
    const randomID = this._id.toString().slice(-4);
	const slug = slugify(this.username, { lower: true });
	this.slug = `${slug}-${this._id}`;
    this.referralCode = `${slug}-${randomID}`
	next();
});

userSchema.pre("save", async function (next) {
	if (this.isModified("password") || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 100;
	next();
});

userSchema.pre("save", function (next) {
	this.otpExpiresIn = Date.now() + 2.9 * 60 * 1000;
	next();
});


// INSTANCE METHODS
userSchema.methods.isOTPExpired = function () {
	if (this.otpCode && this.otpExpiresIn) {
		return Date.now() > this.otpExpiresIn;
	}
	return false;
};

userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
	if (this.passwordChangedAt) {
		const changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwtTimeStamp < changeTimeStamp;
	}
	// return false means not changed
	return false;
};
userSchema.methods.comparePassword = async function (candidatePassword, hashedPassword) {
	const encrypted = await bcrypt.compare(candidatePassword, hashedPassword);
	return encrypted;
};
userSchema.methods.createPasswordResetToken = function () {
	// create random bytes token
	const resetToken = crypto.randomBytes(32).toString("hex");

	// simple hash random bytes token
	const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
	this.passwordResetToken = hashedToken;

	// create time limit for token to expire (10 mins)
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
	// send the unencrypted version
};


const User = mongoose.model('User', userSchema);
module.exports = User;