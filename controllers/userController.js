const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const dateConverter = require('../utils/dateConverter');
const Notification = require('../models/NotificationModel');

////////////////////////////////////////////////
////////////////////////////////////////////////

exports.getAllUser = async(req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: {
                count: users.length,
                users,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            error: err.message
        })
    }
};

exports.getUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.userID);

        res.status(200).json({
            status: "success",
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
};


exports.updateUser = async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userID, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
        })
    }
};

// ADD PROFILE IMAGES
exports.uploadProfilePicture = async (req, res) => {
    try {
        let image;
        if(req.file) image = req.file.filename;

        const updated = await User.findByIdAndUpdate(req.user._id, {image}, {
            new: true,
            runValidators: true,
        });

        const newNotification = await Notification.create({
			user: req.user._id,
			title: 'Updated Profile Picture',
			content: `You just updated your profile picture.`
		});

        res.status(200).json({
            status: 'success',
            data: {
                user: updated,
                newNotification
            }
        });
    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


exports.deleteUser = async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            status: "success",
            data: null
        })
    } catch(err) {
        res.status(404).json({
            status: 'fail',
            message: err.message,
        })
    }
};

// delete current user
exports.deleteAccount = async(req, res, next) => {
    try {
        // GET THE USER
        const currUser = await User.findById(req.user._id).select('+password');
        if(!currUser || !currUser.isActive) {
            return res.json({ message: 'User not found!' });
        }
        // CHECK IF THE PROVIDED PASSWORD IS CORRECT
        if (!(await currUser?.comparePassword(req.body.password, currUser.password))) {
            return res.json({ message: "Incorrect password " });
        }

        await User.findByIdAndUpdate(currUser._id, { isActive: false });

        res.cookie('jwt', '', {
            expires: new Date(Date.now() + 10 * 500),
            httpOnly: true
        }).clearCookie('jwt');

        return res.status(204).json({
            status: "success",
            data: null
        });

    } catch(err) {
        return res.status(400).json({
            status: "fail",
            message: err.message
        })
    }
};
  


////////////////////////////////////////////////////
// update current user data

exports.updateMe = async (req, res) => {
    try {
        console.log(req.user._id)
        // create an error if user POST's password data.
        if(req.body.password || req.body.passwordConfirm) {
            return res.json({ messahe: 'This route is not for password updates. Please use /update-Password.'});
        }
        
        // // 1. filter
        const { email, username, isActive, role, isOTPVerified, isKycVerified } = req.body
        if(email || username || isActive || role  || isOTPVerified || isKycVerified) return res.status(403).json({
            message: 'You are unauthorised to perform this action!'
        })

        // 2. update
        const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
            new: true,
            runValidators: true
        });

        const newNotification = await Notification.create({
			user: req.user._id,
			title: 'Updated Profile Info',
			content: `You just updated your profile info.`
		});

        res.status(200).json({
            status: "success",
            message: 'Profile Updated!',
            data: {
                user: updatedUser,
                newNotification
            }
        })
    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


exports.becomeaVendor = async function(req, res) {
    try {
        const { email, password } = req.body;
        const currUser = await User.findById(req.user._id).select('+password');
        if(currUser.role === 'vendor') {
            return res.json({ message: 'You are already a vendor' })
        }

        if(currUser.email !== email || !(await currUser.comparePassword(password, currUser.password))) {
            return res.json({ message: "Incorrect email or password " });
        }

        currUser.role = 'vendor';
        await currUser.save({ validateBeforeSave: false });

        await Notification.create({
			user: currUser,
			title: 'Account Updated!',
			content: `You can start selling, just became a vendor.`
		});

        res.status(200).json({
            status: 'success',
            message: 'Vendor Reg Successful!',
            data: {
                user: currUser
            }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}

