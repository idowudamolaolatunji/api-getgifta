const mongoose = require('mongoose');


const kycSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        enum: ['id-card', 'driver-license'],
        default: 'id-card'
    },
    frontImg: {
        type: String,
        default: ''
    },
    backImg: {
        type: String,
        default: ''
    },
    selfieImage: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        required: true,
    },
    documentNumber: {
        type: Number,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    cac: {
        type: String,
        default: ''
    },
    utilityBill: {
        type: String,
        default: ''
    },
    acctStatement: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'approved'],
        default: 'pending'
    }
}, {
    timestamps: true
});


kycSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id fullName email image username role isKycVerified'
    });

    next();
});


const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC;