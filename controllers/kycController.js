const User = require('../models/userModel');
const Kyc = require('../models/kycModel');
const Wallet = require('../models/walletModel');
const Admin = require('../models/adminModel');
const Notification = require('../models/NotificationModel');



// SUBMIT KYC
exports.submitKycDoc = async (req, res) => {
    try {
        // GET THE CURRENT REQUESTING USER AND TAKE THE REQ BODY
		const kycUser = await User.findById(req.user._id);
        if(!kycUser || !kycUser.isActive) {
            return res.json({ message: 'User not found!' });
        }

        if(kycUser.isKycVerified) {
            return res.json({ message: 'You are already verified!' });
        }

        const currKycDoc = await Kyc.find({ user: kycUser._id, status: { $ne: 'rejected' }});
        if(currKycDoc.length > 0) return res.json({ message: "You already submitted a kyc request" });

        const kycDoc = await Kyc.create({
            user: kycUser._id,
            documentType: req.body.documentType,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            dob: req.body.dob,
            country: req.body.country,
            documentNumber: req.body.documentNumber,
            cac: req.body.cac || '',
            status: 'pending',
        });

        // CREATE NOTIFICATION DOCUMENT
        await Notification.create({
            user: kycUser._id,
            title: 'You Just Submitted A KYC Request!',
            content: `Please wait while you documents get reviewed by Gifta`,
        });

        res.status(200).json({
            status: 'success',
            message: 'Kyc Submitted!',
            data: {
                kyc: kycDoc
            }
        });

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}


exports.uploadKycImages = async (req, res) => {
    try {
        let selfieImage, frontImage, backImage, utilityBill, acctStatement;
        if(req.files.image || req.files.frontimage || req.files.backimage || (req.files.utilityBill || req.files.acctStatement)) {
            selfieImage = req.files.image.filename;
            frontImage = req.files.frontimage.filename;
            backImage = req.files.backimage.filename;
            utilityBill = req.files.utilityBill.filename;
            acctStatement = req.files.acctStatement.filename;
        }

        await Kyc.findByIdAndUpdate(req.params.id,
            { selfieImage, frontImg: frontImage, backImg: backImage, utilityBill, acctStatement },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
			message: 'Kyc image uploads successful'
        });

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}

exports.getAllKyc = async (req, res) => {
    try {
        const kycDocs = await Kyc.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                kycs: kycDocs
            }
        });

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.getUserKycById = async (req, res) => {
    try {
        const kycDoc = await Kyc.findById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: {
                kycDoc
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}

exports.getMyKycDoc = async (req, res) => {
    try {
        // GET THE CURRENT REQUESTING USER AND TAKE THE REQ BODY
        console.log(req.user)
		const kycUser = await User.findById(req.user._id);
        if(!kycUser || !kycUser.isActive) {
            return res.json({ message: 'User not found!' });
        }
        const kycDocs = await Kyc.find({ user: kycUser._id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                kyc: kycDocs,
                user: kycUser
            }
        });

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}



// KYC APPROVAL BY ADMIN
exports.approveKycDoc = async (req, res) => {
    try {
        // CONFIRM THAT ADMIN ACCESS TO PERFORM TASK
        const { password } = req.body;
        const admin = await Admin.findById(req.user._id).select('+password');
        if(!(await admin.comparePassword(password, admin.password))) {
			return res.json({ message: "Incorrect password" });
		}

        // GET THE KYC USER AND THE PARTICULAR PENDING KYC DOCUMENT
		const kycUser = await User.findById(req.params.userId);
		const kycDoc = await Kyc.findOne({ _id: req.params.docId, user: kycUser._id });

		if(kycDoc.status === 'approved') return res.json({ message: 'This KYC Document has already been approved!' });
		if(kycDoc.status === 'rejected') return res.json({ message: 'This KYC Document has already been rejected, Restart KYC process all over!' });

		// UPDATE THE COMPLETED KYC USER AND THE KYC DOCUMENT 
		kycUser.isKycVerified = true;
		kycDoc.status = 'approved';
		kycUser.save({ validateBeforeSave: false });
		kycDoc.save({});

        const userWallet = await Wallet.findOne({ user: kycUser._id });
        userWallet.pointBalance += 500;
        await userWallet.save({});

        // CREATE NOTIFICATION DOCUMENT
        await Notification.create({
            user: kycUser._id,
            title: 'Your KYC Just Got Approved!',
            content: `Approval of KYC was just confirmed`,
        });
        await Notification.create({
            user: kycUser._id,
            title: 'KYC Completion Rewards!',
            content: `500 points for completion of KYC`,
        });

		res.status(200).json({
			status: 'success',
			message: 'KYC approved :)!',
			data: {
				user: kycUser,
				kycDoc
			}
		});

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
}




// KYC REJECTION BY ADMIN
exports.rejectKycDoc = async (req, res) => {
	try {
        // CONFIRM THAT ADMIN ACCESS TO PERFORM TASK
        const { password, reason } = req.body;
        const admin = await Admin.findById(req.user._id).select('+password');
        if(!(await admin.comparePassword(password, admin.password))) {
			return res.json({ message: "Incorrect password" });
		}

		// GET THE KYC USER AND THE PARTICULAR PENDING KYC DOCUMENT
		const kycUser = await User.findById(req.params.userId);
		const kycDoc = await Kyc.findOne({ _id: req.params.docId, user: kycUser._id });

		if(kycDoc.status === 'approved') return res.json({ message: 'This KYC Document has already been approved!' });
		if(kycDoc.status === 'rejected') return res.json({ message: 'This KYC Document has already been rejected, Restart KYC process all over!' });

		// UPDATE THE COMPLETED KYC USER AND THE KYC DOCUMENT 
		kycDoc.status = 'rejected';
		kycDoc.save({});

        // CREATE NOTIFICATION DOCUMENT
        await Notification.create({
            user: kycUser._id,
            title: 'Your KYC Just Got Rejected!',
            content: `KYC Rejection confirmed! ${reason}, Please try again`,
        });

		res.status(200).json({
			status: 'success',
			message: 'KYC Rejected :(!',
			data: {
				kycDoc
			}
		});
	} catch(err) {
		res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}
